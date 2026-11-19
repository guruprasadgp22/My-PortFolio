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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * HackerRank, every account: challenges solved (from the skill badges), best star rating per skill, passed
 * certificates and submissions per day. Totals are the highest account, never the sum.
 */
@Component
public class HackerRank implements PlatformFetcher {

    private final Http http;
    private final Accounts accounts;

    public HackerRank(Http http, Accounts accounts) {
        this.http = http;
        this.accounts = accounts;
    }

    @Override
    public String id() {
        return "hackerrank";
    }

    private record Account(String user, List<JsonNode> badges, ObjectNode days, List<ObjectNode> certs) {
    }

    private Account account(String u) throws Exception {
        String rest = "https://www.hackerrank.com/rest/hackers/" + u;
        JsonNode badges = null, history = null, certs = null;
        try {
            badges = http.getJson(rest + "/badges");
        } catch (Exception ignored) {
        }
        try {
            history = http.getJson(rest + "/submission_histories");
        } catch (Exception ignored) {
        }
        try {
            certs = http.getJson("https://www.hackerrank.com/community/v1/test_results/hacker_certificate?username=" + u);
        } catch (Exception ignored) {
        }
        if (badges == null && history == null) {
            throw new IOException("hackerrank " + u + ": no data");
        }
        List<JsonNode> list = new ArrayList<>();
        if (badges != null) {
            badges.path("models").forEach(list::add);
        }
        ObjectNode days = history != null && history.isObject() ? (ObjectNode) history : Json.obj();
        List<ObjectNode> passed = new ArrayList<>();
        if (certs != null) {
            for (JsonNode c : certs.path("data")) {
                JsonNode a = c.path("attributes");
                if ("test_passed".equals(a.path("status").asText())) {
                    ObjectNode x = Json.obj();
                    x.set("id", c.get("id"));
                    x.set("name", Json.orNull(a.path("certificate").get("label")));
                    x.set("level", Json.orNull(a.path("certificate").get("level")));
                    x.set("at", Json.orNull(a.get("completed_at")));
                    passed.add(x);
                }
            }
        }
        return new Account(u, list, days, passed);
    }

    @Override
    public JsonNode fetch() throws Exception {
        List<Account> loaded = new ArrayList<>();
        for (String u : accounts.hackerrank()) {
            try {
                loaded.add(account(u));
            } catch (Exception ignored) {
            }
        }
        if (loaded.isEmpty()) {
            throw new IOException("hackerrank: no accounts loaded");
        }
        Map<String, Long> stars = new LinkedHashMap<>();
        ObjectNode days = Json.obj();
        long solved = Long.MIN_VALUE;
        ArrayNode certs = Json.F.arrayNode();
        ArrayNode each = Json.F.arrayNode();
        for (Account a : loaded) {
            for (JsonNode b : a.badges()) {
                if (Json.truthy(b.get("stars"))) {
                    stars.merge(b.path("badge_name").asText(), b.get("stars").asLong(), Math::max);
                }
            }
            long mine = solvedOf(a);
            solved = Math.max(solved, mine);
            a.days().fields().forEachRemaining(e -> {
                double cur = days.has(e.getKey()) ? days.get(e.getKey()).asDouble() : 0;
                days.set(e.getKey(), Json.number(Math.max(cur, Json.num(e.getValue()))));
            });
            certs.addAll(a.certs());

            List<JsonNode> starred = a.badges().stream().filter(b -> Json.truthy(b.get("stars")))
                    .sorted(Comparator.comparingLong((JsonNode b) -> b.get("stars").asLong()).reversed()).toList();
            ObjectNode x = each.addObject();
            x.put("user", a.user());
            x.put("url", "https://www.hackerrank.com/profile/" + a.user());
            x.put("solved", mine);
            if (starred.isEmpty()) {
                x.putNull("best");
            } else {
                ObjectNode best = x.putObject("best");
                best.set("skill", starred.get(0).get("badge_name"));
                best.set("stars", starred.get(0).get("stars"));
            }
            x.put("certs", a.certs().size());
            ArrayNode skills = x.putArray("skills");
            for (JsonNode b : starred) {
                ObjectNode s = skills.addObject();
                String name = b.path("badge_name").asText();
                s.put("name", name.equals("Sql") ? "SQL" : name);
                s.set("stars", b.get("stars"));
                s.put("solved", (long) Json.num(b.get("solved")));
            }
            ArrayNode names = x.putArray("certNames");
            for (ObjectNode c : a.certs()) {
                if (Json.truthy(c.get("name"))) {
                    names.add(Json.truthy(c.get("level")) ? c.get("name").asText() + " (" + c.get("level").asText() + ")" : c.get("name").asText());
                }
            }
            x.set("days", a.days());
        }
        ObjectNode out = Json.obj();
        out.put("solved", solved);
        ObjectNode s = out.putObject("stars");
        stars.forEach(s::put);
        out.set("certs", certs);
        out.set("accounts", each);
        out.set("days", days.isEmpty() ? Json.F.nullNode() : days);
        return out;
    }

    private static long solvedOf(Account a) {
        long n = 0;
        for (JsonNode b : a.badges()) {
            n += (long) Json.num(b.get("solved"));
        }
        return n;
    }
}
