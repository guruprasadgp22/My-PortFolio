package com.guruprasad.portfolio.coding.stats.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.guruprasad.portfolio.coding.stats.Accounts;
import com.guruprasad.portfolio.coding.stats.Http;
import com.guruprasad.portfolio.coding.stats.Json;
import com.guruprasad.portfolio.coding.stats.PlatformFetcher;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * CodeChef has no public API, so this reads the profile page: problems solved, the main and the DSA rating (each
 * with stars, global rank and rated contest history, from the page's date_versus_rating data) and the heat map.
 */
@Component
public class CodeChef implements PlatformFetcher {

    private static final int[][] STARS = {{2500, 7}, {2200, 6}, {2000, 5}, {1800, 4}, {1600, 3}, {1400, 2}, {0, 1}};
    private static final Pattern SOLVED = Pattern.compile("Total Problems Solved:\\s*(\\d+)");
    private static final Pattern ALL_RATING = Pattern.compile("var all_rating = (\\[.*?\\]);", Pattern.DOTALL);
    private static final Pattern DAILY = Pattern.compile("userDailySubmissionsStats = (\\[.*?\\]);", Pattern.DOTALL);
    private static final Pattern PROVISIONAL = Pattern.compile("\"provisional_rating_contest_limit\":(\\d+)");
    private static final Pattern RANK = Pattern.compile("id=.global-rank-([\\w-]+).>[\\s\\S]{0,120}?class=.global-rank.>(\\d+)");
    private static final Pattern DAY = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");

    private final Http http;
    private final Accounts accounts;

    public CodeChef(Http http, Accounts accounts) {
        this.http = http;
        this.accounts = accounts;
    }

    @Override
    public String id() {
        return "codechef";
    }

    static int stars(long rating) {
        for (int[] s : STARS) {
            if (rating >= s[0]) {
                return s[1];
            }
        }
        return 1;
    }

    @Override
    public JsonNode fetch() throws Exception {
        String u = accounts.codechef(), url = "https://www.codechef.com/users/" + u;
        Http.Page page = http.getPage(url);
        if (page.status() != 200) {
            throw new IOException("codechef → " + page.status());
        }
        // an unknown user is redirected to the home page
        if (!URI.create(page.finalUrl()).getPath().startsWith("/users/")) {
            throw new IOException("codechef: no user " + u);
        }
        String h = page.body();
        Matcher solved = SOLVED.matcher(h);
        if (!solved.find()) {
            throw new IOException("codechef: profile layout changed");
        }
        JsonNode tracks = parseObject(h, "\"date_versus_rating\":");
        if (tracks == null) {
            ObjectNode t = Json.obj();
            t.set("all", json(h, ALL_RATING));
            tracks = t;
        }
        JsonNode start = parseObject(h, "\"user_initial_ratings\":");
        Matcher p = PROVISIONAL.matcher(h);
        int provisionalUpTo = p.find() ? Integer.parseInt(p.group(1)) : 5;
        Map<String, Long> ranks = new HashMap<>();
        Matcher r = RANK.matcher(h);
        while (r.find()) {
            ranks.put(r.group(1).replace('-', '_'), Long.parseLong(r.group(2)));
        }

        JsonNode contest = track(tracks.get("all"), "all", start, provisionalUpTo, ranks);
        JsonNode dsa = track(tracks.get("dsa_monday"), "dsa_monday", start, provisionalUpTo, ranks);
        ObjectNode days = Json.obj();
        JsonNode daily = json(h, DAILY);
        if (daily != null) {
            for (JsonNode d : daily) {
                String date = d.path("date").asText();
                if (DAY.matcher(date).matches()) {
                    days.set(date, Json.number(Json.num(d.get("value"))));
                }
            }
        }
        ObjectNode out = Json.obj();
        out.put("user", u);
        out.put("url", url);
        out.put("solved", Long.parseLong(solved.group(1)));
        out.put("contests", (contest == null ? 0 : contest.get("attended").asLong()) + (dsa == null ? 0 : dsa.get("attended").asLong()));
        out.set("rating", contest == null ? Json.F.nullNode() : contest.get("rating"));
        out.set("maxRating", contest == null ? Json.F.nullNode() : contest.get("max"));
        out.set("stars", contest == null ? Json.F.nullNode() : contest.get("stars"));
        out.set("globalRank", contest == null ? Json.F.nullNode() : contest.get("globalRank"));
        out.set("contest", Json.orNull(contest)); // main CodeChef rating (Starters)
        out.set("dsa", Json.orNull(dsa)); // DSA rating (Monday Munch)
        out.set("days", days); // empty when there's nothing yet: an empty map, not an error
        return out;
    }

    private static JsonNode track(JsonNode list, String key, JsonNode start, int provisionalUpTo, Map<String, Long> ranks) {
        if (list == null || !list.isArray()) {
            return null;
        }
        record Row(long t, long r, JsonNode name, Long rank, String url) {
        }
        List<Row> rows = new ArrayList<>();
        for (JsonNode c : list) {
            if (!Json.truthy(c.get("rating")) || Json.truthy(c.get("penalised_in"))) {
                continue;
            }
            long t;
            try {
                t = LocalDateTime.parse(c.path("end_date").asText().replace(" ", "T")).toEpochSecond(ZoneOffset.ofHoursMinutes(5, 30));
            } catch (Exception e) {
                continue;
            }
            long rating = (long) Json.num(c.get("rating"));
            if (t == 0 || rating == 0) {
                continue;
            }
            Long rank = Json.truthy(c.get("rank")) ? (long) Json.num(c.get("rank")) : null;
            String code = c.path("code").asText("");
            rows.add(new Row(t, rating, c.get("name"), rank, code.isEmpty() ? null : "https://www.codechef.com/" + code));
        }
        if (rows.isEmpty()) {
            return null;
        }
        rows.sort(Comparator.comparingLong(Row::t));
        long rating = rows.get(rows.size() - 1).r();
        ObjectNode out = Json.obj();
        out.put("rating", rating);
        out.put("max", rows.stream().mapToLong(Row::r).max().orElse(rating));
        out.put("attended", rows.size());
        out.put("stars", stars(rating));
        out.put("provisional", rows.size() < provisionalUpTo); // CodeChef shows "1312?" until enough rated contests
        Long rank = ranks.get(key);
        if (rank == null) {
            out.putNull("globalRank");
        } else {
            out.put("globalRank", rank);
        }
        double initial = start == null ? 0 : Json.num(start.get(key));
        out.put("start", initial == 0 ? 1000 : (long) initial);
        ArrayNode history = out.putArray("history");
        for (Row row : rows) {
            ObjectNode x = history.addObject();
            x.put("t", row.t());
            x.put("r", row.r());
            x.set("name", row.name());
            if (row.rank() == null) {
                x.putNull("rank");
            } else {
                x.put("rank", row.rank());
            }
            x.put("url", row.url());
        }
        return out;
    }

    private JsonNode json(String h, Pattern p) {
        Matcher m = p.matcher(h);
        if (!m.find()) {
            return null;
        }
        try {
            return http.mapper().readTree(m.group(1));
        } catch (Exception e) {
            return null;
        }
    }

    /** The JSON object right after `key` in the page, e.g. "date_versus_rating":{…}; null if it's missing or broken. */
    private JsonNode parseObject(String h, String key) {
        int i = h.indexOf(key);
        if (i < 0) {
            return null;
        }
        i += key.length();
        if (i >= h.length() || h.charAt(i) != '{') {
            return null;
        }
        boolean str = false;
        int depth = 0;
        for (int j = i; j < h.length(); j++) {
            char ch = h.charAt(j);
            if (str) {
                if (ch == '\\') {
                    j++;
                } else if (ch == '"') {
                    str = false;
                }
            } else if (ch == '"') {
                str = true;
            } else if (ch == '{') {
                depth++;
            } else if (ch == '}' && --depth == 0) {
                try {
                    return http.mapper().readTree(h.substring(i, j + 1));
                } catch (Exception e) {
                    return null;
                }
            }
        }
        return null;
    }
}
