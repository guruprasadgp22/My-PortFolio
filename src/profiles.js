/*
  Turns each platform's live stats into one profile shape, so every platform's panel on the Coding page is drawn
  by the same component (components/Profile.jsx), LeetCode-style (contest ratings live on the Contests page):
    ranking  "Top x%" with the distribution behind it, for platforms without contests (NeetCode)
    solved   total solved (out of how many), still attempting, and the split by difficulty
    side     badges, skill stars, certificates, topics or key facts: whatever that platform offers
  A field is left out when the platform doesn't provide it, and that part of the panel isn't drawn.
*/

// Difficulty → colour slot (CSS vars in global.css, validated for colour-blind safety in both themes).
const LEVEL = { School: "basic", Basic: "basic", Easy: "easy", Medium: "medium", Moderate: "medium", Hard: "hard", Ninja: "hard" };
const level = (k, n, of = null) => ({ k, n: n ?? 0, of, c: LEVEL[k] || "basic" });
const fmt = (n) => (n == null ? "–" : Number(n).toLocaleString("en-IN"));

function leetcode(a) {
  return {
    solved: {
      n: a.solved, of: a.of?.all, attempting: a.attempting,
      levels: [level("Easy", a.easy, a.of?.easy), level("Medium", a.medium, a.of?.medium), level("Hard", a.hard, a.of?.hard)],
    },
    side: a.badges?.length
      ? { kind: "badges", title: "Badges", count: a.badges.length, items: a.badges, recent: a.recentBadge }
      : { kind: "facts", title: "Profile", facts: [["Best streak", `${a.streak ?? 0}d`]] },
  };
}

const BUILDERS = {
  leetcode: (s, acct) => leetcode(acct || s.accounts?.[0] || s),

  gfg: (s) => ({
    solved: {
      n: s.solved,
      levels: ["School", "Basic", "Easy", "Medium", "Hard"].filter((k) => s.levels?.[k] != null).map((k) => level(k, s.levels[k])),
    },
    side: {
      kind: "facts", title: "Profile",
      facts: [
        ["Coding score", fmt(s.score)],
        ...(s.instituteRank ? [["Institute rank", `#${s.instituteRank}`]] : []),
        ...(s.monthlyScore != null ? [["This month", fmt(s.monthlyScore)]] : []),
        ["POTD streak", `${s.currentStreak ?? 0}d · best ${s.streak ?? 0}d`],
      ],
    },
  }),

  neetcode: (s) => {
    const of = s.of && s.of.easy != null ? s.of.easy + s.of.medium + s.of.hard : null;
    return {
      ranking: s.top != null && s.buckets?.length && { top: s.top, buckets: s.buckets, users: s.activeUsers, unit: "problems solved" },
      solved: { n: s.solved, of, levels: [level("Easy", s.easy, s.of?.easy), level("Medium", s.medium, s.of?.medium), level("Hard", s.hard, s.of?.hard)] },
      side: { kind: "facts", title: "Streaks", facts: [["Max streak", `${s.maxStreak ?? 0}d`], ["Current streak", `${s.currentStreak ?? 0}d`], ...(s.top != null ? [["Rank", `Top ${s.top}%`]] : [])] },
    };
  },

  code360: (s) => ({
    solved: {
      n: s.solved,
      levels: ["Easy", "Moderate", "Hard", "Ninja"].filter((k) => s[k] != null && (k !== "Ninja" || s[k] > 0)).map((k) => level(k, s[k])),
    },
    side: s.badges?.length ? { kind: "tags", title: "Topic badges", count: s.badges.length, items: s.badges } : null,
  }),

  hackerrank: (s, a) => {
    const acct = a || s.accounts?.[0];
    if (!acct) return null;
    return {
      solved: { n: acct.solved, unit: "challenges", levels: [] },
      side: {
        kind: "skills", title: "Skill badges", skills: acct.skills || [],
        certs: acct.certNames || [],
      },
    };
  },

  hackerearth: (s) => ({
    solved: { n: s.solved, levels: [] },
    side: {
      kind: "facts", title: "Profile",
      facts: [["Submissions", fmt(s.submitted)], ["Points", fmt(s.score)], ...(s.rank ? [[s.rank.board.replace(" Leaderboard", ""), `#${fmt(s.rank.rank)} · Top ${s.rank.top}%`]] : [])],
    },
  }),

  interviewbit: (s) => ({
    solved: { n: s.solved, levels: [] },
    side: {
      kind: "topics", title: "By topic", topics: s.topics || [],
      facts: [["Score", fmt(s.score)], ...(s.universityRank ? [["University rank", `#${fmt(s.universityRank)}`]] : []), ...(s.globalRank ? [["Global rank", `#${fmt(s.globalRank)}`]] : []), ["Streak", `${s.streak ?? 0}d`]],
    },
  }),
};

// The profile for one platform (and, for platforms with several accounts, one account), or null.
export function profileOf(id, stats, acct) {
  const s = stats?.[id];
  if (!s || !BUILDERS[id]) return null;
  return BUILDERS[id](s, acct);
}
