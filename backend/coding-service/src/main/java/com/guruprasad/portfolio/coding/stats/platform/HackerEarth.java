package com.guruprasad.portfolio.coding.stats.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.guruprasad.portfolio.coding.stats.Accounts;
import com.guruprasad.portfolio.coding.stats.Http;
import com.guruprasad.portfolio.coding.stats.Json;
import com.guruprasad.portfolio.coding.stats.PlatformFetcher;
import org.springframework.stereotype.Component;

/** HackerEarth: problems solved, points, best leaderboard rank and submissions per day. */
@Component
public class HackerEarth implements PlatformFetcher {

    private final Http http;
    private final Accounts accounts;

    public HackerEarth(Http http, Accounts accounts) {
        this.http = http;
        this.accounts = accounts;
    }

    @Override
    public String id() {
        return "hackerearth";
    }

    @Override
    public JsonNode fetch() throws Exception {
        String u = accounts.hackerearth();
        String api = "https://www.hackerearth.com/api/community/user/profile/" + u;
        JsonNode m = http.getJson(api + "/metrics/");
        JsonNode best = null;
        try {
            for (JsonNode r : http.getJson(api + "/leaderboard-rank/")) {
                if (Json.truthy(r.get("rank")) && (best == null || r.path("top_percentage").asDouble() < best.path("top_percentage").asDouble())) {
                    best = r;
                }
            }
        } catch (Exception ignored) {
        }
        ObjectNode days = Json.obj();
        try {
            for (JsonNode d : http.getJson("https://www.hackerearth.com/profiles/api/" + u + "/submission-activity/").path("submission_activity")) {
                if (Json.truthy(d.get("total"))) {
                    String date = d.path("date").asText();
                    date = date.length() > 10 ? date.substring(0, 10) : date;
                    days.set(date, Json.number((days.has(date) ? days.get(date).asDouble() : 0) + Json.num(d.get("total"))));
                }
            }
        } catch (Exception ignored) {
        }
        ObjectNode out = Json.obj();
        out.set("solved", Json.orNull(m.get("problem_solved")));
        out.set("submitted", Json.orNull(m.get("solutions_submitted")));
        out.set("score", Json.orNull(m.get("points")));
        if (best == null) {
            out.putNull("rank");
        } else {
            ObjectNode r = out.putObject("rank");
            r.set("board", best.get("title"));
            r.set("rank", best.get("rank"));
            r.set("top", best.get("top_percentage"));
        }
        out.set("days", days.isEmpty() ? Json.F.nullNode() : days);
        return out;
    }
}
