package com.guruprasad.portfolio.contest.validation;

import com.fasterxml.jackson.databind.JsonNode;
import com.guruprasad.portfolio.common.web.ApiException;
import com.guruprasad.portfolio.contest.entity.Contest;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.regex.Pattern;

/** Checks a contest from the admin page and returns only the known fields. */
public final class ContestValidator {

    private static final Pattern DATE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final Pattern HTTPS = Pattern.compile("^https://\\S+$");

    private ContestValidator() {
    }

    public static Contest clean(JsonNode b) {
        if (b == null || !b.isObject()) {
            throw ApiException.badRequest("Send the contest as JSON");
        }
        Contest c = new Contest();
        c.setPlatform(str(b.get("platform"), 30));
        c.setName(str(b.get("name"), 140));
        c.setDate(str(b.get("date"), 10));
        if (c.getPlatform().isEmpty()) {
            throw ApiException.badRequest("Platform is required");
        }
        if (c.getName().isEmpty()) {
            throw ApiException.badRequest("Contest name is required");
        }
        if (!DATE.matcher(c.getDate()).matches()) {
            throw ApiException.badRequest("Date must be YYYY-MM-DD");
        }
        try {
            LocalDate.parse(c.getDate());
        } catch (DateTimeParseException e) {
            throw ApiException.badRequest("Date must be YYYY-MM-DD");
        }
        c.setRank(whole(b.get("rank"), 1, 10_000_000, "rank"));
        c.setPlayers(whole(b.get("players"), 1, 10_000_000, "players"));
        c.setSolved(whole(b.get("solved"), 0, 100, "solved"));
        c.setOf(whole(b.get("of"), 1, 100, "of"));
        c.setRating(whole(b.get("rating"), 0, 5000, "rating"));
        if (c.getRank() != null && c.getPlayers() != null && c.getRank() > c.getPlayers()) {
            throw ApiException.badRequest("Rank can't be more than the number of participants");
        }
        if (c.getSolved() != null && c.getOf() != null && c.getSolved() > c.getOf()) {
            throw ApiException.badRequest("Solved can't be more than the number of problems");
        }
        String url = str(b.get("url"), 300);
        if (!url.isEmpty() && !HTTPS.matcher(url).matches()) {
            throw ApiException.badRequest("Link must start with https://");
        }
        c.setUrl(url.isEmpty() ? null : url);
        return c;
    }

    private static String str(JsonNode v, int max) {
        if (v == null || !v.isTextual()) {
            return "";
        }
        String t = v.textValue().strip();
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static Integer whole(JsonNode v, long min, long max, String name) {
        if (v == null || v.isNull() || (v.isTextual() && v.textValue().isBlank())) {
            return null;
        }
        double d;
        try {
            d = v.isNumber() ? v.asDouble() : v.isTextual() ? Double.parseDouble(v.textValue().trim()) : Double.NaN;
        } catch (NumberFormatException e) {
            d = Double.NaN;
        }
        if (Double.isNaN(d) || d != Math.rint(d) || d < min || d > max) {
            throw ApiException.badRequest(name + " must be a whole number");
        }
        return (int) d;
    }
}
