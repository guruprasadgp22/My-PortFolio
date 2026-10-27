import { PLATFORMS } from "./data";

// Which key in the /api/stats response feeds each card.
const KEY = { LeetCode: "leetcode", GeeksforGeeks: "gfg", Code360: "code360", HackerRank: "hackerrank", HackerEarth: "hackerearth", InterviewBit: "interviewbit", NeetCode: "neetcode" };
const day = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

// Overlay live numbers on the platform cards from data.js; any source that failed keeps its saved values.
function overlay(p, s) {
  if (!s) return p;
  if (p.n === "LeetCode" && s.leetcode) {
    const l = s.leetcode;
    return {
      ...p,
      val: l.solved,
      lbl: `problems solved · ${l.easy} E / ${l.medium} M / ${l.hard} H${l.accounts?.length > 1 ? ` · best of ${l.accounts.length} accounts` : ""}`,
      meta: [["Max streak", `${l.streak ?? 0}d`]],
      accounts: l.accounts?.map((a) => ({ user: a.user, url: a.url, val: a.solved, note: `${a.easy} E / ${a.medium} M / ${a.hard} H` })) ?? p.accounts,
      live: true,
    };
  }
  if (p.n === "GeeksforGeeks" && s.gfg) {
    return { ...p, val: s.gfg.solved, meta: [["Score", s.gfg.score], ["Institute", `#${s.gfg.instituteRank}`]], live: true };
  }
  if (p.n === "Code360" && s.code360) {
    return { ...p, val: s.code360.solved, meta: [["Moderate", s.code360.Moderate ?? 0], ["Hard", s.code360.Hard ?? 0]], live: true };
  }
  if (p.n === "HackerRank" && s.hackerrank) {
    const h = s.hackerrank;
    const [skill, stars] = Object.entries(h.stars || {}).sort((a, b) => b[1] - a[1])[0] || [];
    return {
      ...p,
      val: h.solved,
      lbl: `challenges solved${h.accounts.length > 1 ? ` · best of ${h.accounts.length} accounts` : ""}`,
      accounts: h.accounts.map((a) => ({
        user: a.user, url: a.url, val: a.solved,
        note: [a.best && `${a.best.skill === "Sql" ? "SQL" : a.best.skill} ${a.best.stars}★`, a.certs && `${a.certs} certificate${a.certs === 1 ? "" : "s"}`].filter(Boolean).join(" · ") || "no badges yet",
      })),
      meta: [...(skill ? [[skill === "Sql" ? "SQL" : skill, `${stars}★`]] : []), ["Certificates", h.certs?.length ?? 0]],
      live: true,
    };
  }
  if (p.n === "HackerEarth" && s.hackerearth) {
    const h = s.hackerearth;
    return {
      ...p,
      val: h.solved ?? p.val,
      lbl: `problems solved${h.submitted ? ` · ${h.submitted} submissions` : ""}`,
      meta: [["Score", h.score ?? "–"], ...(h.rank ? [["Rank", `Top ${h.rank.top}%`]] : [])],
      live: true,
    };
  }
  if (p.n === "InterviewBit" && s.interviewbit) {
    const b = s.interviewbit;
    return {
      ...p,
      val: b.solved,
      lbl: `problems solved · score ${b.score.toLocaleString("en-IN")}`,
      meta: [...(b.universityRank ? [["University rank", `#${b.universityRank}`]] : []), ["Streak", `${b.streak ?? 0}d`]],
      live: true,
    };
  }
  if (p.n === "NeetCode" && s.neetcode) {
    const n = s.neetcode;
    return {
      ...p,
      val: n.solved,
      lbl: `problems solved · ${n.easy} E / ${n.medium} M / ${n.hard} H`,
      meta: [["Max streak", `${n.maxStreak ?? 0}d`], ...(n.top != null ? [["Rank", `Top ${n.top}%`]] : [])],
      live: true,
    };
  }
  return p;
}

// Live numbers where available. A platform that couldn't refresh keeps its last known numbers, with the date
// they're from (staleAt), instead of an error or zero.
export function withLive(p, s) {
  const out = overlay(p, s);
  const at = s?.stale?.[KEY[p.n]];
  return at && out.live ? { ...out, live: false, staleAt: day(at) } : out;
}

// Every platform card, live where possible. One with no number yet (val: null in data.js) is left out.
// The Coding page, About and the quick view all total this same list, so their numbers can't disagree.
export const livePlatforms = (stats) => PLATFORMS.map((p) => withLive(p, stats)).filter((p) => p.val != null);
export const totalSolved = (stats) => livePlatforms(stats).reduce((n, p) => n + p.val, 0);
