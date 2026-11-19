package com.guruprasad.portfolio.coding.stats.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.guruprasad.portfolio.coding.stats.Accounts;
import com.guruprasad.portfolio.coding.stats.Http;
import com.guruprasad.portfolio.coding.stats.Json;
import com.guruprasad.portfolio.coding.stats.PlatformFetcher;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.ZoneOffset;

/**
 * Code360 (Naukri): problems solved by difficulty, topic badges, contest rating (history, rating group and the
 * distribution of all users) and submissions per day for the last year ("streak freeze" days left out).
 */
@Component
public class Code360 implements PlatformFetcher {

    private static final String BASE = "https://www.naukri.com/code360/api/v3/public_section";
    private static final String CTX = "&request_differentiator=1&app_context=publicsection&naukri_request=true";

    private final Http http;
    private final Accounts accounts;

    public Code360(Http http, Accounts accounts) {
        this.http = http;
        this.accounts = accounts;
    }

    @Override
    public String id() {
        return "code360";
    }

    @Override
    public JsonNode fetch() throws Exception {
        JsonNode data = http.getJson(BASE + "/profile/user_details?uuid=" + accounts.code360() + CTX).path("data");
        ObjectNode days = null;
        try {
            days = days();
        } catch (Exception ignored) {
            // the calendar is a bonus
        }
        JsonNode contest = null;
        if (Json.truthy(data.get("has_contest_rating")) && Json.truthy(data.get("uuid"))) {
            try {
                contest = contests(data.get("uuid").asText());
            } catch (Exception ignored) {
                // no contest card this time
            }
        }
        JsonNode counts = data.path("dsa_domain_data").path("problem_count_data");
        ObjectNode out = Json.obj();
        out.set("solved", counts.has("total_count") && !counts.get("total_count").isNull() ? counts.get("total_count") : Json.F.numberNode(0));
        for (JsonNode d : counts.path("difficulty_data")) {
            out.set(d.path("level").asText(), d.get("count"));
        }
        // topic badges: { achiever: { ptm: ["Hash Table"] … } } → ["Achiever · Hash Table"]
        ArrayNode badges = out.putArray("badges");
        data.path("dsa_domain_data").path("badges_hash").fields().forEachRemaining(tier -> {
            String name = tier.getKey().isEmpty() ? "" : Character.toUpperCase(tier.getKey().charAt(0)) + tier.getKey().substring(1);
            tier.getValue().forEach(kind -> {
                if (kind.isArray()) {
                    kind.forEach(topic -> badges.add(name + " · " + topic.asText()));
                } else if (!kind.isNull()) {
                    badges.add(name + " · " + kind.asText());
                }
            });
        });
        out.set("contest", Json.orNull(contest));
        out.set("days", days == null || days.isEmpty() ? Json.F.nullNode() : days);
        return out;
    }

    private ObjectNode days() throws Exception {
        LocalDate end = LocalDate.now(ZoneOffset.UTC), start = end.minusDays(371);
        JsonNode map = http.getJson(BASE + "/profile/contributions?uuid=" + accounts.code360() + "&start_date=" + start + "&end_date=" + end + CTX)
                .path("data").path("contribution_map");
        ObjectNode days = Json.obj();
        map.fields().forEachRemaining(e -> {
            JsonNode d = e.getValue();
            if (!Json.truthy(d.get("streak_freeze_applied")) && Json.truthy(d.get("total"))) {
                days.set(e.getKey(), d.get("total"));
            }
        });
        return days;
    }

    private JsonNode contests(String uuid) throws Exception {
        JsonNode data = http.getJson(BASE + "/user_rating_data?uuid=" + uuid + CTX).path("data");
        ArrayNode history = Json.F.arrayNode();
        long max = Long.MIN_VALUE;
        for (JsonNode h : data.path("user_rating_data")) {
            ObjectNode row = history.addObject();
            long r = Json.round(h.path("rating").asDouble());
            max = Math.max(max, r);
            row.set("t", h.get("date"));
            row.put("r", r);
            row.set("name", h.get("name"));
            row.set("rank", Json.orNull(h.get("rank")));
            row.set("players", Json.orNull(h.get("total_participants")));
            row.set("solved", Json.orNull(h.get("problems_solved")));
        }
        if (history.isEmpty()) {
            return null;
        }
        ObjectNode c = Json.obj();
        // the rating after the latest contest: the number Code360's own profile shows
        c.set("rating", history.get(history.size() - 1).get("r"));
        c.put("max", max);
        c.put("attended", history.size());
        c.set("history", history);
        JsonNode group = data.path("rating_group");
        c.set("group", Json.truthy(group.get("group")) ? group.get("group") : Json.F.nullNode());
        c.set("icon", Json.truthy(group.get("icon")) ? group.get("icon") : Json.F.nullNode());
        ArrayNode hist = c.putArray("hist");
        for (JsonNode b : data.path("rating_distribution")) {
            if (Json.num(b.get("count")) > 0) {
                ObjectNode x = hist.addObject();
                x.set("from", b.get("min"));
                x.set("to", b.get("max"));
                x.set("n", b.get("count"));
            }
        }
        return c;
    }
}
