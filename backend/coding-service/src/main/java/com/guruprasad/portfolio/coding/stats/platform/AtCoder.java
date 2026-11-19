package com.guruprasad.portfolio.coding.stats.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.guruprasad.portfolio.coding.stats.Accounts;
import com.guruprasad.portfolio.coding.stats.Http;
import com.guruprasad.portfolio.coding.stats.Json;
import com.guruprasad.portfolio.coding.stats.PlatformFetcher;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * AtCoder: contest history from atcoder.jp's own JSON, accepted problems from the AtCoder Problems (kenkoooo) API,
 * 500 submissions a page, about one call a second. Problems by points: easy ≤ 300 < medium ≤ 500 < hard.
 */
@Component
public class AtCoder implements PlatformFetcher {

    private static final Object[][] COLORS = {{2800, "Red"}, {2400, "Orange"}, {2000, "Yellow"}, {1600, "Blue"}, {1200, "Cyan"}, {800, "Green"}, {400, "Brown"}, {0, "Gray"}};

    private final Http http;
    private final Accounts accounts;

    public AtCoder(Http http, Accounts accounts) {
        this.http = http;
        this.accounts = accounts;
    }

    @Override
    public String id() {
        return "atcoder";
    }

    private static String color(long rating) {
        for (Object[] c : COLORS) {
            if (rating >= (int) c[0]) {
                return (String) c[1];
            }
        }
        return "Gray";
    }

    @Override
    public JsonNode fetch() throws Exception {
        String u = accounts.atcoder(), url = "https://atcoder.jp/users/" + u;
        JsonNode all = http.getJson(url + "/history/json");
        List<JsonNode> subs = new ArrayList<>();
        long from = 0;
        for (int i = 0; i < 6; i++) {
            JsonNode page = http.getJson("https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=" + u + "&from_second=" + from);
            page.forEach(subs::add);
            if (page.size() < 500) {
                break;
            }
            from = page.get(page.size() - 1).path("epoch_second").asLong() + 1;
            Thread.sleep(1000);
        }
        Map<String, Double> solved = new LinkedHashMap<>();
        ObjectNode days = Json.obj();
        for (JsonNode x : subs) {
            String d = Instant.ofEpochSecond(x.path("epoch_second").asLong()).atZone(ZoneOffset.UTC).toLocalDate().toString();
            days.put(d, (days.has(d) ? days.get(d).asLong() : 0) + 1);
            if ("AC".equals(x.path("result").asText())) {
                solved.put(x.path("problem_id").asText(), x.path("point").asDouble());
            }
        }
        ArrayNode history = Json.F.arrayNode();
        long max = Long.MIN_VALUE;
        for (JsonNode c : all) {
            if (!c.path("IsRated").asBoolean()) {
                continue;
            }
            ObjectNode h = history.addObject();
            h.put("t", OffsetDateTime.parse(c.path("EndTime").asText()).toEpochSecond());
            h.set("r", c.get("NewRating"));
            String en = c.path("ContestNameEn").asText("");
            h.put("name", en.isEmpty() ? c.path("ContestName").asText() : en);
            h.set("rank", c.get("Place"));
            h.set("perf", c.get("Performance"));
            max = Math.max(max, c.path("NewRating").asLong());
        }
        Long rating = history.isEmpty() ? null : history.get(history.size() - 1).get("r").asLong();
        String color = rating == null ? null : color(rating);
        ObjectNode out = Json.obj();
        out.put("user", u);
        out.put("url", url);
        out.put("solved", solved.size());
        out.put("easy", solved.values().stream().filter(p -> p <= 300).count());
        out.put("medium", solved.values().stream().filter(p -> p > 300 && p <= 500).count());
        out.put("hard", solved.values().stream().filter(p -> p > 500).count());
        out.put("joined", all.size()); // contests taken part in, rated or not
        if (rating == null) {
            out.putNull("rating");
            out.putNull("maxRating");
            out.putNull("color");
            out.putNull("contest");
        } else {
            out.put("rating", rating);
            out.put("maxRating", max);
            out.put("color", color);
            ObjectNode c = out.putObject("contest");
            c.put("rating", rating);
            c.put("max", max);
            c.put("attended", history.size());
            c.put("color", color);
            c.set("history", history);
        }
        out.set("days", days);
        return out;
    }
}
