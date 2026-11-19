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
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Predicate;

/**
 * Codeforces (public API, about one call a second): problems solved by problem rating, current and best rating and
 * rank, rated contest history and submissions per day. Problem ratings: easy < 1200 ≤ medium < 1800 ≤ hard.
 */
@Component
public class Codeforces implements PlatformFetcher {

    private static final String API = "https://codeforces.com/api";

    private final Http http;
    private final Accounts accounts;

    public Codeforces(Http http, Accounts accounts) {
        this.http = http;
        this.accounts = accounts;
    }

    @Override
    public String id() {
        return "codeforces";
    }

    @Override
    public JsonNode fetch() throws Exception {
        String u = accounts.codeforces();
        JsonNode info = http.getJson(API + "/user.info?handles=" + u);
        if (!"OK".equals(info.path("status").asText())) {
            throw new IOException("codeforces: " + info.path("comment").asText());
        }
        Thread.sleep(600);
        JsonNode subs = http.getJson(API + "/user.status?handle=" + u + "&from=1&count=10000").path("result");
        Thread.sleep(600);
        JsonNode rated;
        try {
            rated = http.getJson(API + "/user.rating?handle=" + u).path("result");
        } catch (Exception e) {
            rated = Json.F.arrayNode();
        }
        JsonNode me = info.path("result").get(0);
        Map<String, JsonNode> solved = new LinkedHashMap<>();
        ObjectNode days = Json.obj();
        for (JsonNode x : subs) {
            String d = Instant.ofEpochSecond(x.path("creationTimeSeconds").asLong()).atZone(ZoneOffset.UTC).toLocalDate().toString();
            days.put(d, (days.has(d) ? days.get(d).asLong() : 0) + 1);
            if ("OK".equals(x.path("verdict").asText())) {
                JsonNode p = x.path("problem");
                solved.put(p.path("contestId").asText() + "-" + p.path("index").asText(), p.get("rating"));
            }
        }
        ObjectNode out = Json.obj();
        out.put("user", u);
        out.put("url", "https://codeforces.com/profile/" + u);
        out.put("solved", solved.size());
        out.put("easy", count(solved, r -> r != null && r < 1200));
        out.put("medium", count(solved, r -> r != null && r >= 1200 && r < 1800));
        out.put("hard", count(solved, r -> r != null && r >= 1800));
        out.put("unrated", count(solved, r -> r == null));
        out.set("rating", Json.orNull(me.get("rating")));
        out.set("maxRating", Json.orNull(me.get("maxRating")));
        out.set("rank", Json.truthy(me.get("rank")) ? me.get("rank") : Json.F.nullNode());
        out.set("maxRank", Json.truthy(me.get("maxRank")) ? me.get("maxRank") : Json.F.nullNode());
        if (rated.isArray() && !rated.isEmpty()) {
            ObjectNode c = out.putObject("contest");
            long max = Long.MIN_VALUE;
            ArrayNode history = Json.F.arrayNode();
            for (JsonNode r : rated) {
                max = Math.max(max, r.path("newRating").asLong());
                ObjectNode h = history.addObject();
                h.set("t", r.get("ratingUpdateTimeSeconds"));
                h.set("r", r.get("newRating"));
                h.set("name", r.get("contestName"));
                h.set("rank", r.get("rank"));
            }
            c.set("rating", rated.get(rated.size() - 1).get("newRating"));
            c.put("max", max);
            c.put("attended", rated.size());
            c.set("rank", Json.truthy(me.get("rank")) ? me.get("rank") : Json.F.nullNode());
            c.set("history", history);
        } else {
            out.putNull("contest");
        }
        out.set("days", days.isEmpty() ? Json.F.nullNode() : days);
        return out;
    }

    private static long count(Map<String, JsonNode> solved, Predicate<Integer> f) {
        return solved.values().stream().map(v -> v == null || v.isNull() ? null : v.asInt()).filter(f::test).count();
    }
}
