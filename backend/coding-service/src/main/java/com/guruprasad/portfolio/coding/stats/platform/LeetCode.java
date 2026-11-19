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
import java.time.Year;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * LeetCode (GraphQL), every account: solved by difficulty out of how many, still attempting, contest rating, ranking
 * and history, badges, best streak and the daily calendar. Accounts are never added together: totals come from the
 * account with the most problems solved, and each calendar day takes the busier account.
 */
@Component
public class LeetCode implements PlatformFetcher {

    private static final String API = "https://leetcode.com/graphql";
    private static final Map<String, String> HEADERS = Map.of("Referer", "https://leetcode.com");
    private static final String QUERY = """
            query($u:String!,$y:Int,$p:Int){
              allQuestionsCount{difficulty count}
              matchedUser(username:$u){
                submitStatsGlobal{acSubmissionNum{difficulty count}}
                badges{displayName icon creationDate}
                activeBadge{displayName}
                cur:userCalendar(year:$y){streak submissionCalendar}
                prev:userCalendar(year:$p){submissionCalendar}
              }
              userContestRanking(username:$u){rating attendedContestsCount globalRanking totalParticipants topPercentage}
              userContestRankingHistory(username:$u){attended rating ranking problemsSolved totalProblems contest{title startTime}}
              userProfileUserQuestionProgressV2(userSlug:$u){numFailedQuestions{count}}
            }""";

    private final Http http;
    private final Accounts accounts;

    public LeetCode(Http http, Accounts accounts) {
        this.http = http;
        this.accounts = accounts;
    }

    @Override
    public String id() {
        return "leetcode";
    }

    @Override
    public JsonNode fetch() throws Exception {
        List<ObjectNode> loaded = new ArrayList<>();
        for (String u : accounts.leetcode()) {
            try {
                loaded.add(account(u));
            } catch (Exception e) {
                // one account failing still shows the others
            }
        }
        JsonNode histogram;
        try {
            histogram = histogram();
        } catch (Exception e) {
            histogram = null;
        }
        if (loaded.isEmpty()) {
            throw new IOException("leetcode: no accounts loaded");
        }
        ObjectNode top = loaded.get(0);
        for (ObjectNode a : loaded) {
            if (Json.num(a.get("solved")) > Json.num(top.get("solved"))) {
                top = a;
            }
        }
        ObjectNode calendar = Json.obj();
        long streak = 0;
        Long rating = null;
        for (ObjectNode a : loaded) {
            for (Iterator<Map.Entry<String, JsonNode>> it = a.get("calendar").fields(); it.hasNext(); ) {
                Map.Entry<String, JsonNode> e = it.next();
                double cur = calendar.has(e.getKey()) ? calendar.get(e.getKey()).asDouble() : 0;
                calendar.set(e.getKey(), Json.number(Math.max(cur, Json.num(e.getValue()))));
            }
            streak = Math.max(streak, (long) Json.num(a.get("streak")));
            if (Json.truthy(a.get("rating"))) {
                rating = Math.max(rating == null ? Long.MIN_VALUE : rating, a.get("rating").asLong());
            }
        }
        ObjectNode out = Json.obj();
        out.set("solved", top.get("solved"));
        out.set("easy", top.get("easy"));
        out.set("medium", top.get("medium"));
        out.set("hard", top.get("hard"));
        out.set("top", top.get("user"));
        if (rating == null) {
            out.putNull("rating");
        } else {
            out.put("rating", rating);
        }
        out.put("streak", streak);
        out.set("calendar", calendar);
        out.set("accounts", Json.F.arrayNode().addAll(loaded));
        out.set("histogram", Json.orNull(histogram));
        return out;
    }

    private ObjectNode account(String user) throws Exception {
        int year = Year.now(ZoneOffset.UTC).getValue();
        Map<String, Object> vars = Map.of("u", user, "y", year, "p", year - 1);
        JsonNode data = http.postJson(API, Map.of("query", QUERY, "variables", vars), HEADERS).path("data");
        JsonNode u = data.path("matchedUser");
        if (u.isMissingNode() || u.isNull()) {
            throw new IOException("leetcode " + user + ": not found");
        }
        Map<String, JsonNode> n = byDifficulty(u.path("submitStatsGlobal").path("acSubmissionNum"));
        Map<String, JsonNode> all = byDifficulty(data.path("allQuestionsCount"));
        // both years' calendars merged: { unixSeconds: submissions }
        ObjectNode calendar = Json.obj();
        for (String key : List.of("prev", "cur")) {
            String raw = u.path(key).path("submissionCalendar").asText("{}");
            JsonNode cal = http.mapper().readTree(raw.isBlank() ? "{}" : raw);
            cal.fields().forEachRemaining(e -> calendar.set(e.getKey(), e.getValue()));
        }
        JsonNode cr = data.path("userContestRanking");

        ObjectNode a = Json.obj();
        a.put("user", user);
        a.put("url", "https://leetcode.com/u/" + user + "/");
        a.set("solved", Json.orNull(n.get("All")));
        a.set("easy", Json.orNull(n.get("Easy")));
        a.set("medium", Json.orNull(n.get("Medium")));
        a.set("hard", Json.orNull(n.get("Hard")));
        ObjectNode of = a.putObject("of");
        of.set("all", Json.orNull(all.get("All")));
        of.set("easy", Json.orNull(all.get("Easy")));
        of.set("medium", Json.orNull(all.get("Medium")));
        of.set("hard", Json.orNull(all.get("Hard")));
        long attempting = 0;
        for (JsonNode f : data.path("userProfileUserQuestionProgressV2").path("numFailedQuestions")) {
            attempting += (long) Json.num(f.get("count"));
        }
        a.put("attempting", attempting);
        if (Json.truthy(cr.path("rating"))) {
            a.put("rating", Json.round(cr.get("rating").asDouble()));
        } else {
            a.putNull("rating");
        }
        if (Json.truthy(cr.path("attendedContestsCount"))) {
            ObjectNode c = a.putObject("contest");
            c.put("rating", Json.round(cr.get("rating").asDouble()));
            c.set("ranking", Json.orNull(cr.get("globalRanking")));
            c.set("of", Json.orNull(cr.get("totalParticipants")));
            c.set("attended", cr.get("attendedContestsCount"));
            c.set("top", Json.orNull(cr.get("topPercentage")));
            ArrayNode history = c.putArray("history");
            // only contests that were actually ranked (LeetCode doesn't count registered-but-unranked ones either)
            for (JsonNode h : data.path("userContestRankingHistory")) {
                if (!Json.truthy(h.get("attended")) || Json.num(h.get("ranking")) <= 0) {
                    continue;
                }
                ObjectNode row = history.addObject();
                row.set("t", h.path("contest").get("startTime"));
                row.put("r", Json.round(h.path("rating").asDouble()));
                row.set("name", h.path("contest").get("title"));
                row.set("rank", Json.truthy(h.get("ranking")) ? h.get("ranking") : Json.F.nullNode());
                row.set("solved", Json.orNull(h.get("problemsSolved")));
                row.set("of", Json.orNull(h.get("totalProblems")));
            }
        } else {
            a.putNull("contest");
        }
        List<ObjectNode> badges = new ArrayList<>();
        for (JsonNode b : u.path("badges")) {
            ObjectNode x = Json.obj();
            x.set("name", b.get("displayName"));
            String icon = b.path("icon").asText(null);
            x.put("icon", icon != null && icon.startsWith("/") ? "https://leetcode.com" + icon : icon);
            x.set("at", b.get("creationDate"));
            badges.add(x);
        }
        badges.sort(Comparator.comparing((ObjectNode x) -> x.path("at").asText("")).reversed());
        a.set("badges", Json.F.arrayNode().addAll(badges));
        JsonNode recent = u.path("activeBadge").path("displayName");
        a.set("recentBadge", recent.isTextual() && !recent.textValue().isEmpty() ? recent : Json.F.nullNode());
        a.set("streak", Json.orNull(u.path("cur").get("streak")));
        a.set("calendar", calendar);
        return a;
    }

    /** LeetCode's contest rating distribution of all users, for the "Top x%" bars. */
    private JsonNode histogram() throws Exception {
        JsonNode data = http.postJson(API, Map.of("query", "{contestRatingHistogram{userCount ratingStart ratingEnd topPercentage}}"), HEADERS).path("data");
        ArrayNode out = Json.F.arrayNode();
        for (JsonNode b : data.path("contestRatingHistogram")) {
            ObjectNode x = out.addObject();
            x.set("from", b.get("ratingStart"));
            x.set("to", b.get("ratingEnd"));
            x.set("n", b.get("userCount"));
            x.set("top", Json.fixed(b.path("topPercentage").asDouble(), 2));
        }
        return out;
    }

    private static Map<String, JsonNode> byDifficulty(JsonNode list) {
        Map<String, JsonNode> m = new LinkedHashMap<>();
        list.forEach(d -> m.put(d.path("difficulty").asText(), d.get("count")));
        return m;
    }
}
