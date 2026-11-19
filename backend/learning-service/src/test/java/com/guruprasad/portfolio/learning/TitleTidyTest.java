package com.guruprasad.portfolio.learning;

import com.guruprasad.portfolio.learning.youtube.TitleTidy;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class TitleTidyTest {

    @Test
    void keepsTheLessonAndTheLeetCodeNumber() {
        TitleTidy.Tidy t = TitleTidy.tidy("Two Sum | Leetcode 1 | Detailed Explanation | @codestorywithMIK");
        assertEquals("Two Sum", t.title());
        assertEquals(1, t.leetcode());
    }

    @Test
    void dropsCompaniesTagsAndEmoji() {
        assertEquals("Find the Difference · 3 Approaches", TitleTidy.tidy("Find the Difference | 3 Approaches | Phone Interview | AMAZON | Leetcode - 389").title());
        assertEquals("Two Sum II - Input Array Is Sorted", TitleTidy.tidy("Two Sum II - Input Array Is Sorted : Explanation ➕ Live Coding 🧑🏻‍💻 (In Hinglish)").title());
        assertEquals("3Sum Closest", TitleTidy.tidy("3Sum Closest - (Meta, Amazon, Microsoft, Oracle)Live Coding").title());
        assertEquals("Introduction · Basics", TitleTidy.tidy("Segment Tree | Introduction | Basics | Build Segment Tree | Video 1 | codestorywithMIK").title());
        assertNull(TitleTidy.tidy("Your Roadmap to Master Advanced AI | What's Coming in This Playlist? | Advanced AI Playlist | MIK").leetcode());
    }
}
