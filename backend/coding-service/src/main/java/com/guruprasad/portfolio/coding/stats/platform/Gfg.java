package com.guruprasad.portfolio.coding.stats.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.guruprasad.portfolio.coding.stats.Accounts;
import com.guruprasad.portfolio.coding.stats.Http;
import com.guruprasad.portfolio.coding.stats.Json;
import com.guruprasad.portfolio.coding.stats.PlatformFetcher;
import org.springframework.stereotype.Component;

import java.time.Year;
import java.time.ZoneOffset;
import java.util.Map;

/** GeeksforGeeks: problems solved, coding score, institute rank, POTD streaks, solved by difficulty and the calendar. */
@Component
public class Gfg implements PlatformFetcher {

    private static final String SUBMISSIONS = "https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/";

    private final Http http;
    private final Accounts accounts;

    public Gfg(Http http, Accounts accounts) {
        this.http = http;
        this.accounts = accounts;
    }

    @Override
    public String id() {
        return "gfg";
    }

    @Override
    public JsonNode fetch() throws Exception {
        String u = accounts.gfg();
        int year = Year.now(ZoneOffset.UTC).getValue();
        JsonNode data = http.getJson("https://authapi.geeksforgeeks.org/api-get/user-profile-info/?handle=" + u).path("data");
        // the calendar and the split by difficulty are a bonus: if they fail, the card still gets its numbers
        ObjectNode days = Json.obj();
        for (int y : new int[]{year - 1, year}) {
            try {
                JsonNode r = http.postJson(SUBMISSIONS, Map.of("handle", u, "requestType", "getYearwiseUserSubmissions", "year", String.valueOf(y), "month", ""), Map.of()).path("result");
                if (r.isObject()) {
                    r.fields().forEachRemaining(e -> days.set(e.getKey(), e.getValue()));
                }
            } catch (Exception ignored) {
                // keep what loaded
            }
        }
        ObjectNode levels = Json.obj();
        try {
            JsonNode r = http.postJson(SUBMISSIONS, Map.of("handle", u, "requestType", "", "year", "", "month", ""), Map.of()).path("result");
            r.fields().forEachRemaining(e -> levels.put(e.getKey(), e.getValue().isObject() ? e.getValue().size() : 0));
        } catch (Exception ignored) {
            // no split by difficulty this time
        }
        ObjectNode out = Json.obj();
        out.set("solved", Json.orNull(data.get("total_problems_solved")));
        out.set("score", Json.orNull(data.get("score")));
        out.set("monthlyScore", Json.orNull(data.get("monthly_score")));
        out.set("instituteRank", Json.orNull(data.get("institute_rank")));
        out.set("streak", Json.orNull(data.get("pod_solved_longest_streak")));
        out.set("currentStreak", Json.orNull(data.get("pod_solved_current_streak")));
        out.set("levels", levels.isEmpty() ? Json.F.nullNode() : levels);
        out.set("days", days.isEmpty() ? Json.F.nullNode() : days);
        return out;
    }
}
