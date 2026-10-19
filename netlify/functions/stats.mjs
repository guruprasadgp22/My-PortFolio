// Live coding stats for the Coding page: LeetCode, GeeksforGeeks, Code360, HackerRank, HackerEarth, NeetCode,
// InterviewBit and the GitHub contribution graph, fetched server-side
// (their APIs block browser requests) and cached on Netlify's CDN for 6 hours.
const USERS = {
  leetcode: "guruprasadgp22",
  gfg: "guruprasadgp22",
  code360: "guruprasadgp",
  github: "guruprasadgp22",
  hackerrank: ["guruprasad6200", "gp130143"], // both accounts are added together
  hackerearth: "guruprasadgp",
  neetcode: "PrimalPikachu220",
  interviewbit: "guruprasad-gp_339",
};
// Code360's firewall rejects non-browser user agents, so send a regular browser one.
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...init.headers }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

async function leetcode() {
  const year = new Date().getUTCFullYear();
  const query = `query($u:String!,$y:Int,$p:Int){
    matchedUser(username:$u){
      submitStatsGlobal{acSubmissionNum{difficulty count}}
      cur:userCalendar(year:$y){streak submissionCalendar}
      prev:userCalendar(year:$p){submissionCalendar}
    }
    userContestRanking(username:$u){rating}
  }`;
  const { data } = await getJson("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables: { u: USERS.leetcode, y: year, p: year - 1 } }),
  });
  const u = data.matchedUser;
  const n = Object.fromEntries(u.submitStatsGlobal.acSubmissionNum.map((d) => [d.difficulty, d.count]));
  // Merge both years' calendars: { unixSeconds: submissions }
  const calendar = { ...JSON.parse(u.prev?.submissionCalendar || "{}"), ...JSON.parse(u.cur?.submissionCalendar || "{}") };
  return {
    solved: n.All, easy: n.Easy, medium: n.Medium, hard: n.Hard,
    rating: data.userContestRanking?.rating ? Math.round(data.userContestRanking.rating) : null,
    streak: u.cur?.streak ?? null,
    calendar,
  };
}

// GFG submissions per day for one year: { "YYYY-MM-DD": count }
async function gfgYear(year) {
  const { result } = await getJson("https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle: USERS.gfg, requestType: "getYearwiseUserSubmissions", year: String(year), month: "" }),
  });
  return result && typeof result === "object" ? result : {};
}

async function gfg() {
  const year = new Date().getUTCFullYear();
  const [profile, cur, prev] = await Promise.allSettled([
    getJson(`https://authapi.geeksforgeeks.org/api-get/user-profile-info/?handle=${USERS.gfg}`),
    gfgYear(year),
    gfgYear(year - 1),
  ]);
  if (profile.status !== "fulfilled") throw profile.reason;
  const data = profile.value.data;
  // the calendar is a bonus: if it fails, the card still gets its numbers
  const days = { ...(prev.value || {}), ...(cur.value || {}) };
  return {
    solved: data.total_problems_solved, score: data.score, instituteRank: data.institute_rank, streak: data.pod_solved_longest_streak,
    days: Object.keys(days).length ? days : null,
  };
}

// GitHub's public contribution graph (the same one on the profile page), parsed from its HTML:
// each day is a <td data-date id> and a matching <tool-tip for=id> says "N contributions on …".
async function github() {
  const res = await fetch(`https://github.com/users/${USERS.github}/contributions`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`github → ${res.status}`);
  const html = await res.text();
  const dateOf = {};
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const date = m[0].match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    const id = m[0].match(/\bid="([^"]+)"/)?.[1];
    if (date && id) dateOf[id] = date;
  }
  const days = {};
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const date = dateOf[m[1]];
    if (date) days[date] = +(m[2].match(/^([\d,]+) contributions?/)?.[1].replace(/,/g, "") || 0);
  }
  if (!Object.keys(days).length) throw new Error("github: no calendar found");
  return { days, total: Object.values(days).reduce((a, b) => a + b, 0) };
}

// Code360 submissions per day for the last year: { "YYYY-MM-DD": count }.
// "Streak freeze" days are left out: nothing was submitted on them.
async function code360Days() {
  const iso = (d) => d.toISOString().slice(0, 10);
  const end = new Date(), start = new Date(Date.now() - 371 * 86400000);
  const { data } = await getJson(
    `https://www.naukri.com/code360/api/v3/public_section/profile/contributions?uuid=${USERS.code360}&start_date=${iso(start)}&end_date=${iso(end)}&request_differentiator=1&app_context=publicsection&naukri_request=true`
  );
  const days = {};
  for (const [date, d] of Object.entries(data?.contribution_map || {})) if (!d.streak_freeze_applied && d.total) days[date] = d.total;
  return days;
}

async function code360() {
  const base = `https://www.naukri.com/code360/api/v3/public_section/profile`;
  const [profile, days] = await Promise.allSettled([
    getJson(`${base}/user_details?uuid=${USERS.code360}&request_differentiator=1&app_context=publicsection&naukri_request=true`),
    code360Days(),
  ]);
  if (profile.status !== "fulfilled") throw profile.reason;
  const data = profile.value.data;
  const levels = Object.fromEntries((data.dsa_domain_data?.problem_count_data?.difficulty_data || []).map((d) => [d.level, d.count]));
  return { solved: data.dsa_domain_data?.problem_count_data?.total_count ?? 0, ...levels, days: days.value && Object.keys(days.value).length ? days.value : null };
}

// HackerRank, all accounts combined: challenges solved (from the skill badges), the best star rating per
// skill, passed certificates, and submissions per day.
async function hackerrankAccount(u) {
  const rest = `https://www.hackerrank.com/rest/hackers/${u}`;
  const [badges, history, certs] = await Promise.allSettled([
    getJson(`${rest}/badges`),
    getJson(`${rest}/submission_histories`),
    getJson(`https://www.hackerrank.com/community/v1/test_results/hacker_certificate?username=${u}`),
  ]);
  if (badges.status !== "fulfilled" && history.status !== "fulfilled") throw new Error(`hackerrank ${u}: no data`);
  return {
    badges: badges.value?.models || [],
    days: history.value && typeof history.value === "object" ? history.value : {},
    certs: (certs.value?.data || [])
      .filter((c) => c.attributes?.status === "test_passed")
      .map((c) => ({ id: c.id, name: c.attributes.certificate?.label, level: c.attributes.certificate?.level, at: c.attributes.completed_at })),
  };
}

async function hackerrank() {
  const accounts = (await Promise.allSettled(USERS.hackerrank.map(hackerrankAccount))).filter((r) => r.status === "fulfilled").map((r) => r.value);
  if (!accounts.length) throw new Error("hackerrank: no accounts loaded");
  const stars = {};
  let solved = 0;
  for (const a of accounts)
    for (const b of a.badges) {
      solved += b.solved || 0;
      if (b.stars) stars[b.badge_name] = Math.max(stars[b.badge_name] || 0, b.stars);
    }
  const days = {};
  for (const a of accounts) for (const [d, n] of Object.entries(a.days)) days[d] = (days[d] || 0) + (+n || 0);
  return { solved, stars, certs: accounts.flatMap((a) => a.certs), accounts: accounts.length, days: Object.keys(days).length ? days : null };
}

// HackerEarth: problems solved, points and leaderboard rank, plus submissions per day.
async function hackerearth() {
  const api = `https://www.hackerearth.com/api/community/user/profile/${USERS.hackerearth}`;
  const [metrics, ranks, activity] = await Promise.allSettled([
    getJson(`${api}/metrics/`),
    getJson(`${api}/leaderboard-rank/`),
    getJson(`https://www.hackerearth.com/profiles/api/${USERS.hackerearth}/submission-activity/`),
  ]);
  if (metrics.status !== "fulfilled") throw metrics.reason;
  const m = metrics.value;
  const best = (ranks.value || []).filter((r) => r.rank).sort((a, b) => a.top_percentage - b.top_percentage)[0];
  const days = {};
  for (const d of activity.value?.submission_activity || []) if (d.total) days[String(d.date).slice(0, 10)] = (days[String(d.date).slice(0, 10)] || 0) + d.total;
  return {
    solved: m.problem_solved, submitted: m.solutions_submitted, score: m.points,
    rank: best ? { board: best.title, rank: best.rank, top: best.top_percentage } : null,
    days: Object.keys(days).length ? days : null,
  };
}

// NeetCode: the public profile (same call the profile page makes): solved by difficulty, streaks,
// percentile and activity per day.
async function neetcode() {
  const { data } = await getJson("https://neetcode.io/api/callableFunctionHttp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: { functionId: "getProfileByHandle", handle: USERS.neetcode } }),
  });
  const st = data.ncAllDifficultyStats || {};
  const n = (k) => st[k]?.completed ?? 0;
  return {
    solved: n("easy") + n("medium") + n("hard"), easy: n("easy"), medium: n("medium"), hard: n("hard"),
    maxStreak: data.maxStreak ?? null, currentStreak: data.currentStreak ?? null,
    top: data.ranking?.percentile != null ? +(100 - data.ranking.percentile).toFixed(1) : null,
    days: data.activityByDate && Object.keys(data.activityByDate).length ? data.activityByDate : null,
  };
}

// InterviewBit (the profile must be public): problems solved and score, global and university rank,
// current streak, and submissions per day for this year and last.
async function interviewbit() {
  const u = USERS.interviewbit, base = "https://www.interviewbit.com/v2";
  const year = new Date().getUTCFullYear();
  const [profile, solved, streak, cur, prev] = await Promise.allSettled([
    getJson(`${base}/profile/username?id=${u}`),
    getJson(`${base}/problem_list/problems_solved_overview_count?username=${u}`),
    getJson(`${base}/profile/username/streak/?id=${u}`),
    getJson(`${base}/profile/username/daily-user-submissions/${year}/?id=${u}`),
    getJson(`${base}/profile/username/daily-user-submissions/${year - 1}/?id=${u}`),
  ]);
  if (profile.status !== "fulfilled" && solved.status !== "fulfilled") throw new Error("interviewbit: profile is private or unavailable");
  const courses = solved.value?.course_problems_solved || [];
  const days = {};
  for (const d of [...(prev.value || []), ...(cur.value || [])]) if (d?.count) days[d.date] = (days[d.date] || 0) + d.count;
  return {
    solved: courses.reduce((n, c) => n + (c.solved_problems_count || 0), 0),
    score: courses.reduce((n, c) => n + (c.total_user_score || 0), 0),
    globalRank: profile.value?.global_rank ?? null,
    universityRank: profile.value?.university_rank ?? null,
    streak: streak.value?.current_streak ?? null,
    days: Object.keys(days).length ? days : null,
  };
}

export default async () => {
  // Each source can fail on its own; the page falls back to the numbers in data.js for that card.
  const [lc, g, c, gh, hr, he, nc, ib] = await Promise.allSettled([leetcode(), gfg(), code360(), github(), hackerrank(), hackerearth(), neetcode(), interviewbit()]);
  const pick = (r) => (r.status === "fulfilled" ? r.value : null);
  const body = { updated: new Date().toISOString(), leetcode: pick(lc), gfg: pick(g), code360: pick(c), github: pick(gh), hackerrank: pick(hr), hackerearth: pick(he), neetcode: pick(nc), interviewbit: pick(ib) };
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      "Netlify-CDN-Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
};

export const config = { path: "/api/stats" };
