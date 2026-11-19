package com.guruprasad.portfolio.learning.youtube;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Tidies a video title the way the Learning page shows it:
 *   "Two Sum | Leetcode 1 | Detailed Explanation | @codestorywithMIK"  →  "Two Sum", LeetCode 1
 * Keeps the lesson name and at most one detail; drops channel tags, company names and language notes.
 */
public final class TitleTidy {

    public record Tidy(String title, Integer leetcode) {
    }

    private static final int I = Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE;
    private static final Pattern NOISE = Pattern.compile("detailed explanation|full explanation|explanation|hindi|hinglish|english|java|c\\+\\+|python"
            + "|code ?story ?with ?mik|mik|leetcode|gfg|dsa|video solution|deep dive|live coding|.*\\bplaylist\\b.*|.*\\binterview\\b.*|#\\S+"
            + "|concepts & questions.*|story to code|video \\d+|.*\\bexplanation\\b.*|similar to.*|made (super )?easy|detailed( reason)?"
            + "|binary lifting|dp on trees|segment tree", I);
    private static final Pattern UPPER = Pattern.compile("[A-Z0-9 &,.-]+");
    private static final String COMPANY = "google|amazon|microsoft|meta|facebook|apple|adobe|paytm|oracle|uber|flipkart|netflix|makemytrip|samsung"
            + "|goldman sachs|walmart|linkedin|bloomberg|qualcomm|intuit|atlassian|zoho|tcs|infosys|accenture|swiggy|zomato|phonepe|vmware"
            + "|salesforce|nvidia|de shaw|twitter|yahoo|ola|myntra";
    private static final Pattern COMPANIES = Pattern.compile("(?:(?:" + COMPANY + ")\\s*(?:,|&|and)?\\s*)+", I);
    private static final Pattern EMOJI = Pattern.compile("[\\p{IsExtended_Pictographic}\\x{1F3FB}-\\x{1F3FF}\\x{200D}\\x{FE0F}\\x{2795}]");
    private static final Pattern LEETCODE = Pattern.compile("\\bleet ?code\\s*[-#:]?\\s*(\\d{1,4})\\b", I);
    private static final Pattern HANDLE = Pattern.compile("@\\S+");
    private static final Pattern EXPLAIN_TAIL = Pattern.compile("\\s*:\\s*explanation\\b.*$", I);
    private static final Pattern IN_LANGUAGE = Pattern.compile("\\(\\s*in \\w+\\s*\\)", I);
    private static final Pattern DASH_PAREN_TAIL = Pattern.compile("\\s*-\\s*\\(.*$");
    private static final Pattern SPACES = Pattern.compile("\\s+");
    private static final Pattern BAR = Pattern.compile("\\s*\\|\\s*");

    private TitleTidy() {
    }

    public static Tidy tidy(String raw) {
        String title = SPACES.matcher(EMOJI.matcher(raw == null ? "" : raw).replaceAll("")).replaceAll(" ").strip();
        Matcher lc = LEETCODE.matcher(title);
        Integer leetcode = null;
        if (lc.find()) {
            int n = Integer.parseInt(lc.group(1));
            leetcode = n > 0 ? n : null;
        }
        List<String> parts = new ArrayList<>();
        for (String p : BAR.split(title)) {
            String s = LEETCODE.matcher(p).replaceFirst("");
            s = HANDLE.matcher(s).replaceAll("");
            s = EXPLAIN_TAIL.matcher(s).replaceFirst("");
            s = IN_LANGUAGE.matcher(s).replaceAll("");
            s = DASH_PAREN_TAIL.matcher(s).replaceFirst("");
            s = SPACES.matcher(s).replaceAll(" ").strip();
            if (!s.isEmpty()) {
                parts.add(s);
            }
        }
        // the first piece is the lesson (unless it's only the series name); later pieces are dropped when they're tags
        List<String> use = !parts.isEmpty() && NOISE.matcher(parts.get(0)).matches() && parts.size() > 1 ? parts.subList(1, parts.size()) : parts;
        List<String> keep = new ArrayList<>();
        if (!use.isEmpty()) {
            keep.add(use.get(0));
            use.stream().skip(1)
                    .filter(p -> !(p.length() > 1 && UPPER.matcher(p).matches()) && !NOISE.matcher(p).matches() && !COMPANIES.matcher(p).matches())
                    .findFirst().ifPresent(keep::add);
        }
        String t = keep.isEmpty() ? title : String.join(" · ", keep);
        return new Tidy(t.length() > 160 ? t.substring(0, 160) : t, leetcode);
    }
}
