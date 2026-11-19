package com.guruprasad.portfolio.learning.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.web.ApiException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Checks a course from the admin page. Returns only the known fields (unknown ones are dropped, never stored).
 * With partial = true (editing), only the fields that were sent are checked and returned.
 */
public final class CourseValidator {

    public static final List<String> GROUPS = List.of("ai", "dsa", "other");
    private static final Pattern LIST_PARAM = Pattern.compile("[?&]list=([\\w-]+)");
    private static final Pattern BARE_ID = Pattern.compile("^([\\w-]{10,64})$");

    private CourseValidator() {
    }

    /** "https://youtube.com/playlist?list=PL…&si=…" or a bare id → the id; null if it isn't one. */
    public static String playlistId(JsonNode v) {
        String s = str(v, 300);
        Matcher m = LIST_PARAM.matcher(s);
        if (m.find()) {
            return m.group(1);
        }
        m = BARE_ID.matcher(s);
        return m.find() ? m.group(1) : null;
    }

    public static Map<String, Object> clean(JsonNode b, boolean partial) {
        if (b == null || !b.isObject()) {
            throw ApiException.badRequest("Send the course as JSON");
        }
        Map<String, Object> out = new LinkedHashMap<>();
        if (!partial || b.has("title")) {
            String title = str(b.get("title"), 120);
            if (title.isEmpty()) {
                throw ApiException.badRequest("Title is required");
            }
            out.put("title", title);
        }
        if (b.has("sub")) {
            out.put("sub", str(b.get("sub"), 160));
        }
        if (!partial || b.has("group")) {
            JsonNode g = b.get("group");
            if (g == null || !g.isTextual() || !GROUPS.contains(g.textValue())) {
                throw ApiException.badRequest("Group must be one of " + String.join(", ", GROUPS));
            }
            out.put("group", g.textValue());
        }
        if (!partial || b.has("done")) {
            Integer done = Numbers.whole(b.has("done") ? b.get("done") : null, 0, 5000, "done");
            out.put("done", done == null ? 0 : done);
        }
        if (!partial || b.has("count")) {
            Integer count = Numbers.whole(b.get("count"), 1, 5000, "count");
            if (count == null) {
                if (!partial) {
                    throw ApiException.badRequest("Total lessons is required");
                }
            } else {
                out.put("count", count);
            }
        }
        if (b.has("order")) {
            Integer order = Numbers.whole(b.get("order"), 0, 999, "order");
            if (order != null) {
                out.put("order", order);
            }
        }
        if (out.get("done") instanceof Integer d && out.get("count") instanceof Integer c && d > c) {
            throw ApiException.badRequest("Lessons done can't be more than the total");
        }
        if (b.has("focus")) {
            List<String> raw = new ArrayList<>();
            JsonNode f = b.get("focus");
            if (f.isArray()) {
                f.forEach(x -> raw.add(x.isTextual() ? x.textValue() : ""));
            } else {
                for (String s : (f.isTextual() ? f.textValue() : "").split(",")) {
                    raw.add(s);
                }
            }
            out.put("focus", raw.stream().map(s -> trim(s, 40)).filter(s -> !s.isEmpty()).limit(12).toList());
        }
        return out;
    }

    static String str(JsonNode v, int max) {
        return v != null && v.isTextual() ? trim(v.textValue(), max) : "";
    }

    private static String trim(String s, int max) {
        String t = s.strip();
        return t.length() > max ? t.substring(0, max) : t;
    }
}
