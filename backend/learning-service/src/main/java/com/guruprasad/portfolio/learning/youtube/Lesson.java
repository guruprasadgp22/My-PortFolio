package com.guruprasad.portfolio.learning.youtube;

import com.fasterxml.jackson.annotation.JsonInclude;

/** One video of a playlist: v = video id, t = tidied title, s = length in seconds, lc = LeetCode problem number. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record Lesson(String v, String t, int s, Integer lc) {
}
