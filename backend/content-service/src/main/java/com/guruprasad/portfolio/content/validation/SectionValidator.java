package com.guruprasad.portfolio.content.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.web.ApiException;
import org.bson.Document;

import java.util.Iterator;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Checks a page section before it's saved. Only plain JSON gets through:
 *   - only the known sections, each a list or a single object as the site expects
 *   - no field names starting with "$" (MongoDB operators) or __proto__ / constructor / prototype
 *   - no javascript: / vbscript: / data:text/html links, even with spaces or control characters hidden inside
 *   - at most 8 levels deep, 500 items per list, 20,000 characters per text and 300 KB per section
 */
public final class SectionValidator {

    public static final Map<String, String> TYPES = Map.ofEntries(
            Map.entry("ME", "object"), Map.entry("ABOUT", "object"), Map.entry("DOING", "array"),
            Map.entry("EXPERIENCE", "array"), Map.entry("EDUCATION", "array"), Map.entry("CERTIFICATIONS", "array"),
            Map.entry("JOURNEY", "array"), Map.entry("JOURNEY_MAP", "array"), Map.entry("SKILLS", "array"),
            Map.entry("PROJECTS", "array"), Map.entry("PLATFORMS", "array"), Map.entry("INTERVIEWS", "array"),
            Map.entry("FESTIVALS", "array"));

    private static final int MAX_BYTES = 300 * 1024;
    private static final Pattern BAD_KEY = Pattern.compile("^\\$|^(__proto__|constructor|prototype)$");
    private static final Pattern BAD_URL = Pattern.compile("^(javascript|vbscript):|^data:text/html", Pattern.CASE_INSENSITIVE);
    private static final Pattern HIDDEN = Pattern.compile("[\\s\\x00-\\x1f]");

    private SectionValidator() {
    }

    /** The section as a MongoDB value (Document or list), or a 400 with what's wrong. */
    public static Object clean(String key, JsonNode data) {
        String type = TYPES.get(key);
        if (type == null) {
            throw ApiException.badRequest("Unknown section");
        }
        if (data == null || ("array".equals(type) != data.isArray()) || !(data.isArray() || data.isObject())) {
            throw ApiException.badRequest(key + " must be a " + ("array".equals(type) ? "list" : "single object"));
        }
        String json = data.toString();
        if (json.length() > MAX_BYTES) {
            throw ApiException.badRequest("That's too much content for one section");
        }
        String error = plain(data, 0, key);
        if (error != null) {
            throw ApiException.badRequest(error);
        }
        // MongoDB's own parser keeps whole numbers as numbers and everything else exactly as sent
        return Document.parse("{\"v\":" + json + "}").get("v");
    }

    private static String plain(JsonNode v, int depth, String path) {
        if (depth > 8) {
            return path + " is nested too deeply";
        }
        if (v.isNull() || v.isBoolean()) {
            return null;
        }
        if (v.isNumber()) {
            return Double.isFinite(v.asDouble()) ? null : path + " must be a real number";
        }
        if (v.isTextual()) {
            String s = v.textValue();
            if (s.length() > 20000) {
                return path + " is too long";
            }
            return BAD_URL.matcher(HIDDEN.matcher(s).replaceAll("")).find() ? path + " has a link type that isn't allowed" : null;
        }
        if (v.isArray()) {
            if (v.size() > 500) {
                return path + " has too many items";
            }
            for (int i = 0; i < v.size(); i++) {
                String e = plain(v.get(i), depth + 1, path + "[" + i + "]");
                if (e != null) {
                    return e;
                }
            }
            return null;
        }
        if (v.isObject()) {
            for (Iterator<Map.Entry<String, JsonNode>> it = v.fields(); it.hasNext(); ) {
                Map.Entry<String, JsonNode> f = it.next();
                String k = f.getKey();
                if (BAD_KEY.matcher(k).find() || k.length() > 60) {
                    return path + " has a field name that isn't allowed (\"" + k.substring(0, Math.min(20, k.length())) + "\")";
                }
                String e = plain(f.getValue(), depth + 1, path + "." + k);
                if (e != null) {
                    return e;
                }
            }
            return null;
        }
        return path + " has a value that isn't allowed";
    }
}
