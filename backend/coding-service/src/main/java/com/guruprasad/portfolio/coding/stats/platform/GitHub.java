package com.guruprasad.portfolio.coding.stats.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.guruprasad.portfolio.coding.stats.Accounts;
import com.guruprasad.portfolio.coding.stats.Http;
import com.guruprasad.portfolio.coding.stats.Json;
import com.guruprasad.portfolio.coding.stats.PlatformFetcher;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * GitHub's public contribution graph (the one on the profile page), read from its HTML: each day is a
 * <td data-date id> and a matching <tool-tip for=id> says "N contributions on …".
 */
@Component
public class GitHub implements PlatformFetcher {

    private static final Pattern TD = Pattern.compile("<td\\b[^>]*>");
    private static final Pattern DATE = Pattern.compile("data-date=\"(\\d{4}-\\d{2}-\\d{2})\"");
    private static final Pattern ID = Pattern.compile("\\bid=\"([^\"]+)\"");
    private static final Pattern TIP = Pattern.compile("<tool-tip\\b[^>]*\\bfor=\"([^\"]+)\"[^>]*>([^<]*)</tool-tip>");
    private static final Pattern COUNT = Pattern.compile("^([\\d,]+) contributions?");

    private final Http http;
    private final Accounts accounts;

    public GitHub(Http http, Accounts accounts) {
        this.http = http;
        this.accounts = accounts;
    }

    @Override
    public String id() {
        return "github";
    }

    @Override
    public JsonNode fetch() throws Exception {
        Http.Page page = http.getPage("https://github.com/users/" + accounts.github() + "/contributions");
        if (page.status() != 200) {
            throw new IOException("github → " + page.status());
        }
        String html = page.body();
        Map<String, String> dateOf = new HashMap<>();
        Matcher td = TD.matcher(html);
        while (td.find()) {
            Matcher d = DATE.matcher(td.group()), i = ID.matcher(td.group());
            if (d.find() && i.find()) {
                dateOf.put(i.group(1), d.group(1));
            }
        }
        ObjectNode days = Json.obj();
        long total = 0;
        Matcher tip = TIP.matcher(html);
        while (tip.find()) {
            String date = dateOf.get(tip.group(1));
            if (date != null) {
                Matcher c = COUNT.matcher(tip.group(2));
                long n = c.find() ? Long.parseLong(c.group(1).replace(",", "")) : 0;
                days.put(date, n);
            }
        }
        if (days.isEmpty()) {
            throw new IOException("github: no calendar found");
        }
        for (JsonNode v : days) {
            total += v.asLong();
        }
        ObjectNode out = Json.obj();
        out.set("days", days);
        out.put("total", total);
        return out;
    }
}
