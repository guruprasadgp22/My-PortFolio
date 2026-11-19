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

/** InterviewBit (profile must be public): solved, score, global and university rank, streak, topics and the calendar. */
@Component
public class InterviewBit implements PlatformFetcher {

    private final Http http;
    private final Accounts accounts;

    public InterviewBit(Http http, Accounts accounts) {
        this.http = http;
        this.accounts = accounts;
    }

    @Override
    public String id() {
        return "interviewbit";
    }

    private JsonNode tryGet(String url) {
        try {
            return http.getJson(url);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public JsonNode fetch() throws Exception {
        String u = accounts.interviewbit(), base = "https://www.interviewbit.com/v2";
        int year = Year.now(ZoneOffset.UTC).getValue();
        JsonNode profile = tryGet(base + "/profile/username?id=" + u);
        JsonNode solved = tryGet(base + "/problem_list/problems_solved_overview_count?username=" + u);
        if (profile == null && solved == null) {
            throw new IOException("interviewbit: profile is private or unavailable");
        }
        JsonNode streak = tryGet(base + "/profile/username/streak/?id=" + u);
        JsonNode prev = tryGet(base + "/profile/username/daily-user-submissions/" + (year - 1) + "/?id=" + u);
        JsonNode cur = tryGet(base + "/profile/username/daily-user-submissions/" + year + "/?id=" + u);

        JsonNode courses = solved == null ? Json.F.arrayNode() : solved.path("course_problems_solved");
        long count = 0, score = 0;
        ArrayNode courseList = Json.F.arrayNode();
        for (JsonNode c : courses) {
            count += (long) Json.num(c.get("solved_problems_count"));
            score += (long) Json.num(c.get("total_user_score"));
            ObjectNode x = courseList.addObject();
            x.set("name", c.get("title"));
            x.set("solved", c.get("solved_problems_count"));
            x.set("score", c.get("total_user_score"));
            x.set("of", c.get("total_score"));
        }
        ArrayNode topics = Json.F.arrayNode();
        if (solved != null) {
            for (JsonNode t : solved.path("topic_problems_solved")) {
                if (Json.truthy(t.get("solved_problems_count"))) {
                    ObjectNode x = topics.addObject();
                    x.set("name", t.get("title"));
                    x.set("solved", t.get("solved_problems_count"));
                    x.set("score", t.get("total_user_score"));
                    x.set("of", t.get("total_score"));
                }
            }
        }
        ObjectNode days = Json.obj();
        for (JsonNode list : new JsonNode[]{prev, cur}) {
            if (list != null && list.isArray()) {
                for (JsonNode d : list) {
                    if (Json.truthy(d.get("count"))) {
                        String date = d.path("date").asText();
                        days.set(date, Json.number((days.has(date) ? days.get(date).asDouble() : 0) + Json.num(d.get("count"))));
                    }
                }
            }
        }
        ObjectNode out = Json.obj();
        out.put("solved", count);
        out.put("score", score);
        out.set("globalRank", profile == null ? Json.F.nullNode() : Json.orNull(profile.get("global_rank")));
        out.set("universityRank", profile == null ? Json.F.nullNode() : Json.orNull(profile.get("university_rank")));
        out.set("streak", streak == null ? Json.F.nullNode() : Json.orNull(streak.get("current_streak")));
        out.set("courses", courseList);
        out.set("topics", topics);
        out.set("days", days.isEmpty() ? Json.F.nullNode() : days);
        return out;
    }
}
