// Live coding stats for the Coding page: LeetCode, GeeksforGeeks, Code360, HackerRank, HackerEarth, NeetCode,
// InterviewBit and the GitHub contribution graph, fetched server-side
// (their APIs block browser requests) and cached on Netlify's CDN for 6 hours.
const USERS = {
  leetcode: ["guruprasadgp22", "guruprasad6200"], // every account is shown on its own; totals use the highest, not the sum
  gfg: "guruprasadgp22",
  code360: "guruprasadgp",
  github: "guruprasadgp22",
  hackerrank: ["guruprasad6200", "gp130143"], // every account is shown on its own; totals use the highest, not the sum
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

// One LeetCode account, everything its profile page shows: solved by difficulty (out of how many), problems
// still being attempted, contest rating / ranking / history, badges, best streak and the daily calendar.
const LC_ICON = (src) => (src?.startsWith("/") ? `https://leetcode.com${src}` : src);
async function leetcodeAccount(user) {
  const year = new Date().getUTCFullYear();
  const query = `query($u:String!,$y:Int,$p:Int){
    allQuestionsCount{difficulty count}
    matchedUser(username:$u){
      submitStatsGlobal{acSubmissionNum{difficulty count}}
      badges{displayName icon creationDate}
      activeBadge{displayName}
      cur:userCalendar(year:$y){streak submissionCalendar}
      prev:userCalendar(year:$p){submissionCalendar}
    }
    userContestRanking(username:$u){rating attendedContestsCount globalRanking totalParticipants topPercentage}
    userContestRankingHistory(username:$u){attended rating ranking problemsSolved totalProblems contest{title startTime}}
    userProfileUserQuestionProgressV2(userSlug:$u){numFailedQuestions{count}}
  }`;
  const { data } = await getJson("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query, variables: { u: user, y: year, p: year - 1 } }),
  });
  const u = data.matchedUser;
  if (!u) throw new Error(`leetcode ${user}: not found`);
  const n = Object.fromEntries(u.submitStatsGlobal.acSubmissionNum.map((d) => [d.difficulty, d.count]));
  // Merge both years' calendars: { unixSeconds: submissions }
  const calendar = { ...JSON.parse(u.prev?.submissionCalendar || "{}"), ...JSON.parse(u.cur?.submissionCalendar || "{}") };
  const all = Object.fromEntries((data.allQuestionsCount || []).map((d) => [d.difficulty, d.count]));
  const cr = data.userContestRanking;
  return {
    user, url: `https://leetcode.com/u/${user}/`,
    solved: n.All, easy: n.Easy, medium: n.Medium, hard: n.Hard,
    of: { all: all.All, easy: all.Easy, medium: all.Medium, hard: all.Hard },
    attempting: (data.userProfileUserQuestionProgressV2?.numFailedQuestions || []).reduce((t, d) => t + d.count, 0),
    rating: cr?.rating ? Math.round(cr.rating) : null,
    contest: cr?.attendedContestsCount
      ? {
          rating: Math.round(cr.rating), ranking: cr.globalRanking, of: cr.totalParticipants, attended: cr.attendedContestsCount, top: cr.topPercentage,
          // only contests that were actually ranked (registered-but-unranked ones aren't counted by LeetCode either)
          history: (data.userContestRankingHistory || []).filter((h) => h.attended && h.ranking > 0).map((h) => ({ t: h.contest.startTime, r: Math.round(h.rating), name: h.contest.title, rank: h.ranking || null, solved: h.problemsSolved ?? null, of: h.totalProblems ?? null })),
        }
      : null,
    badges: (u.badges || []).map((b) => ({ name: b.displayName, icon: LC_ICON(b.icon), at: b.creationDate })).sort((a, b) => (a.at < b.at ? 1 : -1)),
    recentBadge: u.activeBadge?.displayName || null,
    streak: u.cur?.streak ?? null,
    calendar,
  };
}

// LeetCode's contest rating distribution (all users), for the "Top x%" bars. Shared by every account.
async function leetcodeHistogram() {
  const { data } = await getJson("https://leetcode.com/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json", Referer: "https://leetcode.com" },
    body: JSON.stringify({ query: "{contestRatingHistogram{userCount ratingStart ratingEnd topPercentage}}" }),
  });
  return (data?.contestRatingHistogram || []).map((b) => ({ from: b.ratingStart, to: b.ratingEnd, n: b.userCount, top: +b.topPercentage.toFixed(2) }));
}

// All LeetCode accounts. Accounts are never added together (that would count a problem solved on both twice):
// the totals are the account with the most problems solved, and each day of the calendar takes the busier account.
async function leetcode() {
  const [results, hist] = await Promise.all([Promise.allSettled(USERS.leetcode.map(leetcodeAccount)), leetcodeHistogram().catch(() => null)]);
  const accounts = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
  if (!accounts.length) throw new Error("leetcode: no accounts loaded");
  const top = accounts.reduce((a, b) => ((b.solved || 0) > (a.solved || 0) ? b : a));
  const calendar = {};
  for (const a of accounts) for (const [ts, c] of Object.entries(a.calendar)) calendar[ts] = Math.max(calendar[ts] || 0, c);
  const ratings = accounts.map((a) => a.rating).filter(Boolean);
  return {
    solved: top.solved, easy: top.easy, medium: top.medium, hard: top.hard, top: top.user,
    rating: ratings.length ? Math.max(...ratings) : null,
    streak: Math.max(0, ...accounts.map((a) => a.streak || 0)),
    calendar,
    // each account keeps its own calendar and profile too, so the Coding page can show one profile per account
    accounts,
    histogram: hist,
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

// GFG problems solved, grouped by difficulty: { School, Basic, Easy, Medium, Hard } → count
async function gfgLevels() {
  const { result } = await getJson("https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ handle: USERS.gfg, requestType: "", year: "", month: "" }),
  });
  return Object.fromEntries(Object.entries(result || {}).map(([k, v]) => [k, Object.keys(v || {}).length]));
}

async function gfg() {
  const year = new Date().getUTCFullYear();
  const [profile, cur, prev, levels] = await Promise.allSettled([
    getJson(`https://authapi.geeksforgeeks.org/api-get/user-profile-info/?handle=${USERS.gfg}`),
    gfgYear(year),
    gfgYear(year - 1),
    gfgLevels(),
  ]);
  if (profile.status !== "fulfilled") throw profile.reason;
  const data = profile.value.data;
  // the calendar is a bonus: if it fails, the card still gets its numbers
  const days = { ...(prev.value || {}), ...(cur.value || {}) };
  return {
    solved: data.total_problems_solved, score: data.score, monthlyScore: data.monthly_score ?? null, instituteRank: data.institute_rank,
    streak: data.pod_solved_longest_streak, currentStreak: data.pod_solved_current_streak ?? null,
    levels: levels.value && Object.keys(levels.value).length ? levels.value : null,
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

// Code360 contest rating: rating after each contest, rating group (Beginner, Specialist…) and the rating
// distribution of all users. Needs the account's internal id, which user_details returns.
async function code360Contests(uuid) {
  const { data } = await getJson(`https://www.naukri.com/code360/api/v3/public_section/user_rating_data?uuid=${uuid}&request_differentiator=1&app_context=publicsection&naukri_request=true`);
  const history = (data?.user_rating_data || []).map((h) => ({ t: h.date, r: Math.round(h.rating), name: h.name, rank: h.rank ?? null, players: h.total_participants ?? null, solved: h.problems_solved ?? null }));
  if (!history.length) return null;
  // the rating after the latest contest, which is the number Code360's own profile shows (1485, not a rounded 1486)
  const rating = history.at(-1).r;
  const dist = (data.rating_distribution || []).filter((b) => b.count > 0).map((b) => ({ from: b.min, to: b.max, n: b.count }));
  return {
    rating, max: Math.max(...history.map((h) => h.r)), attended: history.length, history,
    group: data.rating_group?.group || null, icon: data.rating_group?.icon || null,
    // Code360's own "top x%" isn't in its API, and an estimate from the buckets wouldn't match the site, so it's left out
    hist: dist,
  };
}

async function code360() {
  const base = `https://www.naukri.com/code360/api/v3/public_section/profile`;
  const [profile, days] = await Promise.allSettled([
    getJson(`${base}/user_details?uuid=${USERS.code360}&request_differentiator=1&app_context=publicsection&naukri_request=true`),
    code360Days(),
  ]);
  if (profile.status !== "fulfilled") throw profile.reason;
  const data = profile.value.data;
  const contest = data.has_contest_rating && data.uuid ? await code360Contests(data.uuid).catch(() => null) : null;
  const levels = Object.fromEntries((data.dsa_domain_data?.problem_count_data?.difficulty_data || []).map((d) => [d.level, d.count]));
  // topic badges: { achiever: { ptm: ["Hash Table"] … } } → ["Achiever · Hash Table"]
  const badges = Object.entries(data.dsa_domain_data?.badges_hash || {}).flatMap(([tier, kinds]) =>
    Object.values(kinds || {}).flat().map((topic) => `${tier[0].toUpperCase()}${tier.slice(1)} · ${topic}`)
  );
  return { solved: data.dsa_domain_data?.problem_count_data?.total_count ?? 0, ...levels, badges, contest, days: days.value && Object.keys(days.value).length ? days.value : null };
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
    user: u,
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
  // accounts are never added together: the total is the highest account, each day takes the busier account
  const stars = {};
  for (const a of accounts) for (const b of a.badges) if (b.stars) stars[b.badge_name] = Math.max(stars[b.badge_name] || 0, b.stars);
  const solvedOf = (a) => a.badges.reduce((t, b) => t + (b.solved || 0), 0);
  const solved = Math.max(...accounts.map(solvedOf));
  const days = {};
  for (const a of accounts) for (const [d, n] of Object.entries(a.days)) days[d] = Math.max(days[d] || 0, +n || 0);
  // each account on its own: challenges solved, its best skill badge and passed certificates
  const each = accounts.map((a) => {
    const best = a.badges.filter((b) => b.stars).sort((x, y) => y.stars - x.stars)[0];
    return {
      user: a.user, url: `https://www.hackerrank.com/profile/${a.user}`,
      solved: solvedOf(a),
      best: best ? { skill: best.badge_name, stars: best.stars } : null,
      certs: a.certs.length,
      skills: a.badges.filter((b) => b.stars).map((b) => ({ name: b.badge_name === "Sql" ? "SQL" : b.badge_name, stars: b.stars, solved: b.solved || 0 })).sort((x, y) => y.stars - x.stars),
      certNames: a.certs.filter((c) => c.name).map((c) => (c.level ? `${c.name} (${c.level})` : c.name)),
      days: a.days,
    };
  });
  return { solved, stars, certs: accounts.flatMap((a) => a.certs), accounts: each, days: Object.keys(days).length ? days : null };
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
    of: { easy: st.easy?.total ?? null, medium: st.medium?.total ?? null, hard: st.hard?.total ?? null },
    // how many users solved how many problems, for the "Top x%" bars
    buckets: (data.ranking?.buckets || []).map((b) => ({ label: b.label, n: b.count, pct: +b.percentage.toFixed(1), me: !!b.isUserBucket })),
    activeUsers: data.ranking?.totalActiveUsers ?? null,
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
    courses: courses.map((c) => ({ name: c.title, solved: c.solved_problems_count, score: c.total_user_score, of: c.total_score })),
    topics: (solved.value?.topic_problems_solved || []).filter((t) => t.solved_problems_count).map((t) => ({ name: t.title, solved: t.solved_problems_count, score: t.total_user_score, of: t.total_score })),
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
