package com.guruprasad.portfolio.coding.stats;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * The profile on each platform (application.yml → portfolio.accounts). LeetCode and HackerRank have two accounts:
 * each is shown on its own and totals use the highest, never the sum (a problem solved on both would count twice).
 */
@ConfigurationProperties("portfolio.accounts")
public record Accounts(List<String> leetcode, String gfg, String code360, String github, List<String> hackerrank, String hackerearth,
                       String neetcode, String interviewbit, String codeforces, String codechef, String atcoder) {
}
