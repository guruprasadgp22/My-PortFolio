package com.guruprasad.portfolio.coding.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.coding.entity.Correction;
import com.guruprasad.portfolio.common.web.ApiException;

import java.util.List;

/** Every field optional: an empty field means "use the live number". */
public final class CorrectionValidator {

    public static final List<String> PLATFORMS = List.of("leetcode", "gfg", "code360", "hackerrank", "hackerearth", "neetcode", "interviewbit", "codeforces", "codechef", "atcoder");

    private CorrectionValidator() {
    }

    public static Correction clean(JsonNode b) {
        if (b == null || !b.isObject()) {
            throw ApiException.badRequest("Send the numbers as JSON");
        }
        Correction c = new Correction();
        c.setSolved(whole(b.get("solved"), "solved"));
        c.setEasy(whole(b.get("easy"), "easy"));
        c.setMedium(whole(b.get("medium"), "medium"));
        c.setHard(whole(b.get("hard"), "hard"));
        return c;
    }

    public static boolean empty(Correction c) {
        return c.getSolved() == null && c.getEasy() == null && c.getMedium() == null && c.getHard() == null;
    }

    private static Integer whole(JsonNode v, String name) {
        if (v == null || v.isNull() || (v.isTextual() && v.textValue().isBlank())) {
            return null;
        }
        double d;
        try {
            d = v.isNumber() ? v.asDouble() : v.isTextual() ? Double.parseDouble(v.textValue().trim()) : Double.NaN;
        } catch (NumberFormatException e) {
            d = Double.NaN;
        }
        if (Double.isNaN(d) || d != Math.rint(d) || d < 0 || d > 100000) {
            throw ApiException.badRequest(name + " must be a whole number");
        }
        return (int) d;
    }
}
