package com.guruprasad.portfolio.coding.stats.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.guruprasad.portfolio.coding.stats.Accounts;
import com.guruprasad.portfolio.coding.stats.Http;
import com.guruprasad.portfolio.coding.stats.Json;
import com.guruprasad.portfolio.coding.stats.PlatformFetcher;
import org.springframework.stereotype.Component;

import java.util.Map;

/** NeetCode's public profile (the same call its profile page makes): solved, streaks, percentile and activity. */
@Component
public class NeetCode implements PlatformFetcher {

    private final Http http;
    private final Accounts accounts;

    public NeetCode(Http http, Accounts accounts) {
        this.http = http;
        this.accounts = accounts;
    }

    @Override
    public String id() {
        return "neetcode";
    }

    @Override
    public JsonNode fetch() throws Exception {
        JsonNode data = http.postJson("https://neetcode.io/api/callableFunctionHttp",
                Map.of("data", Map.of("functionId", "getProfileByHandle", "handle", accounts.neetcode())), Map.of()).path("data");
        JsonNode st = data.path("ncAllDifficultyStats");
        long easy = (long) Json.num(st.path("easy").get("completed")), medium = (long) Json.num(st.path("medium").get("completed")), hard = (long) Json.num(st.path("hard").get("completed"));
        ObjectNode out = Json.obj();
        out.put("solved", easy + medium + hard);
        out.put("easy", easy);
        out.put("medium", medium);
        out.put("hard", hard);
        ObjectNode of = out.putObject("of");
        of.set("easy", Json.orNull(st.path("easy").get("total")));
        of.set("medium", Json.orNull(st.path("medium").get("total")));
        of.set("hard", Json.orNull(st.path("hard").get("total")));
        ArrayNode buckets = out.putArray("buckets");
        for (JsonNode b : data.path("ranking").path("buckets")) {
            ObjectNode x = buckets.addObject();
            x.set("label", b.get("label"));
            x.set("n", b.get("count"));
            x.set("pct", Json.fixed(b.path("percentage").asDouble(), 1));
            x.put("me", Json.truthy(b.get("isUserBucket")));
        }
        out.set("activeUsers", Json.orNull(data.path("ranking").get("totalActiveUsers")));
        out.set("maxStreak", Json.orNull(data.get("maxStreak")));
        out.set("currentStreak", Json.orNull(data.get("currentStreak")));
        JsonNode pct = data.path("ranking").get("percentile");
        out.set("top", pct == null || pct.isNull() ? Json.F.nullNode() : Json.fixed(100 - pct.asDouble(), 1));
        JsonNode days = data.get("activityByDate");
        out.set("days", days != null && days.isObject() && !days.isEmpty() ? days : Json.F.nullNode());
        return out;
    }
}
