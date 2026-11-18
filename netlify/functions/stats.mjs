// Live coding stats for the Coding page: LeetCode, GeeksforGeeks, Code360, HackerRank, HackerEarth, NeetCode,
// InterviewBit, Codeforces, CodeChef, AtCoder and the GitHub contribution graph, fetched server-side
// (their APIs block browser requests) and cached on Netlify's CDN for 6 hours.
// With a database (MONGODB_URI), every platform that loads is saved as its last good result, and a platform
// whose API fails is answered from that save instead (listed in `snap` with when it's from).
import { db, hasDb, within } from "../lib/db.mjs";

const USERS = {
  leetcode: ["guruprasadgp22", "guruprasad6200"], // every account is shown on its own; totals use the highest, not the sum
  gfg: "guruprasadgp22",
  code360: "guruprasadgp",
  github: "guruprasadgp22",
  hackerrank: ["guruprasad6200", "gp130143"], // every account is shown on its own; totals use the highest, not the sum
  hackerearth: "guruprasadgp",
  neetcode: "PrimalPikachu220",
  interviewbit: "guruprasad-gp_339",
  codeforces: "guruprasadgp",
  codechef: "guruprasadgp",
  atcoder: "guruprasadgp",
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

// Codeforces (public API, asks for no more than about one call a second): problems solved split by problem
// rating, current / best rating and rank, rated contest history, and submissions per day.
async function codeforces() {
  const u = USERS.codeforces, api = "https://codeforces.com/api";
  const pause = () => new Promise((r) => setTimeout(r, 600));
  const info = await getJson(`${api}/user.info?handles=${u}`);
  if (info.status !== "OK") throw new Error(`codeforces: ${info.comment}`);
  await pause();
  const subs = (await getJson(`${api}/user.status?handle=${u}&from=1&count=10000`)).result || [];
  await pause();
  const rated = (await getJson(`${api}/user.rating?handle=${u}`).catch(() => null))?.result || [];
  const me = info.result[0];
  const solved = new Map();
  const days = {};
  for (const x of subs) {
    const d = new Date(x.creationTimeSeconds * 1000).toISOString().slice(0, 10);
    days[d] = (days[d] || 0) + 1;
    if (x.verdict === "OK") solved.set(`${x.problem.contestId}-${x.problem.index}`, x.problem.rating ?? null);
  }
  const by = (f) => [...solved.values()].filter(f).length;
  return {
    user: u, url: `https://codeforces.com/profile/${u}`,
    solved: solved.size,
    // Codeforces rates problems 800–3500; grouped the way most people read them
    easy: by((r) => r != null && r < 1200), medium: by((r) => r != null && r >= 1200 && r < 1800), hard: by((r) => r != null && r >= 1800), unrated: by((r) => r == null),
    rating: me.rating ?? null, maxRating: me.maxRating ?? null, rank: me.rank || null, maxRank: me.maxRank || null,
    contest: rated.length
      ? { rating: rated.at(-1).newRating, max: Math.max(...rated.map((c) => c.newRating)), attended: rated.length, rank: me.rank || null,
          history: rated.map((c) => ({ t: c.ratingUpdateTimeSeconds, r: c.newRating, name: c.contestName, rank: c.rank })) }
      : null,
    days: Object.keys(days).length ? days : null,
  };
}

// The JSON object that follows `key` in the page, e.g. "date_versus_rating":{…}; null if it's missing or broken.
function parseObject(h, key) {
  let i = h.indexOf(key);
  if (i < 0) return null;
  i += key.length;
  if (h[i] !== "{") return null;
  for (let depth = 0, j = i, str = false; j < h.length; j++) {
    const ch = h[j];
    if (str) {
      if (ch === "\\") j++;
      else if (ch === '"') str = false;
    } else if (ch === '"') str = true;
    else if (ch === "{") depth++;
    else if (ch === "}" && --depth === 0) {
      try {
        return JSON.parse(h.slice(i, j + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}
// CodeChef has no public API, so read its profile page: problems solved, the main and DSA ratings (each with
// stars, global rank and rated contest history) and the submissions heat map.
const CC_STARS = [[2500, 7], [2200, 6], [2000, 5], [1800, 4], [1600, 3], [1400, 2], [0, 1]];
async function codechef() {
  const u = USERS.codechef, url = `https://www.codechef.com/users/${u}`;
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`codechef → ${res.status}`);
  // an unknown user is redirected to the home page
  if (!new URL(res.url).pathname.startsWith("/users/")) throw new Error(`codechef: no user ${u}`);
  const h = await res.text();
  const solved = h.match(/Total Problems Solved:\s*(\d+)/);
  if (!solved) throw new Error("codechef: profile layout changed");
  const json = (re) => {
    try {
      return JSON.parse(h.match(re)?.[1] || "null");
    } catch {
      return null;
    }
  };
  // Every rating CodeChef keeps, each with its own history: "all" is the main CodeChef rating, "dsa_monday" the
  // DSA rating from the Monday Munch DSA challenges. Read from the page's settings JSON (date_versus_rating).
  const tracks = parseObject(h, '"date_versus_rating":') || { all: json(/var all_rating = (\[.*?\]);/s) || [] };
  const start = parseObject(h, '"user_initial_ratings":') || {};
  const provisionalUpTo = +(h.match(/"provisional_rating_contest_limit":(\d+)/)?.[1] || 5);
  // global rank per rating: <div id='global-rank-dsa-monday'>…<strong class='global-rank'>1008</strong>
  const ranks = {};
  for (const m of h.matchAll(/id=.global-rank-([\w-]+).>[\s\S]{0,120}?class=.global-rank.>(\d+)/g)) ranks[m[1].replace(/-/g, "_")] = +m[2];
  const track = (key) => {
    const history = (tracks[key] || [])
      .filter((c) => c.rating && !c.penalised_in)
      .map((c) => ({ t: Math.floor(Date.parse(`${c.end_date.replace(" ", "T")}+05:30`) / 1000), r: +c.rating, name: c.name, rank: c.rank ? +c.rank : null, url: c.code ? `https://www.codechef.com/${c.code}` : null }))
      .filter((c) => c.t && c.r)
      .sort((a, b) => a.t - b.t);
    if (!history.length) return null;
    const rating = history.at(-1).r;
    return {
      rating, max: Math.max(...history.map((c) => c.r)), attended: history.length,
      stars: CC_STARS.find(([r]) => rating >= r)[1],
      provisional: history.length < provisionalUpTo, // CodeChef shows "1312?" until enough rated contests
      globalRank: ranks[key] ?? null,
      start: +start[key] || 1000,
      history,
    };
  };
  const contest = track("all"), dsa = track("dsa_monday");
  const days = {};
  for (const d of json(/userDailySubmissionsStats = (\[.*?\]);/s) || []) if (/^\d{4}-\d{2}-\d{2}$/.test(d.date)) days[d.date] = +d.value || 0;
  return {
    user: u, url,
    solved: +solved[1],
    contests: (contest?.attended ?? 0) + (dsa?.attended ?? 0),
    rating: contest?.rating ?? null, maxRating: contest?.max ?? null, stars: contest?.stars ?? null, globalRank: contest?.globalRank ?? null,
    contest, // main CodeChef rating (Starters)
    dsa, // DSA rating (Monday Munch)
    days, // empty when there's nothing yet: an empty map, not an error
  };
}

// AtCoder: contest history from atcoder.jp's own JSON, and accepted problems from the AtCoder Problems
// (kenkoooo) API, 500 submissions a page, about one call a second. Problems are grouped by their points:
// easy ≤ 300 < medium ≤ 500 < hard.
const AC_COLOR = [[2800, "Red"], [2400, "Orange"], [2000, "Yellow"], [1600, "Blue"], [1200, "Cyan"], [800, "Green"], [400, "Brown"], [0, "Gray"]];
async function atcoder() {
  const u = USERS.atcoder, url = `https://atcoder.jp/users/${u}`;
  const all = await getJson(`${url}/history/json`);
  const subs = [];
  for (let from = 0, i = 0; i < 6; i++) {
    const page = await getJson(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${u}&from_second=${from}`);
    subs.push(...page);
    if (page.length < 500) break;
    from = page.at(-1).epoch_second + 1;
    await new Promise((r) => setTimeout(r, 1000));
  }
  const solved = new Map(), days = {};
  for (const x of subs) {
    const d = new Date(x.epoch_second * 1000).toISOString().slice(0, 10);
    days[d] = (days[d] || 0) + 1;
    if (x.result === "AC") solved.set(x.problem_id, x.point);
  }
  const by = (f) => [...solved.values()].filter(f).length;
  const rated = all.filter((c) => c.IsRated);
  const history = rated.map((c) => ({ t: Math.floor(Date.parse(c.EndTime) / 1000), r: c.NewRating, name: c.ContestNameEn || c.ContestName, rank: c.Place, perf: c.Performance }));
  const rating = history.at(-1)?.r ?? null;
  const max = history.length ? Math.max(...history.map((c) => c.r)) : null;
  const color = rating != null ? AC_COLOR.find(([r]) => rating >= r)[1] : null;
  return {
    user: u, url,
    solved: solved.size,
    easy: by((p) => p <= 300), medium: by((p) => p > 300 && p <= 500), hard: by((p) => p > 500),
    joined: all.length, // contests taken part in, rated or not
    rating, maxRating: max, color,
    contest: history.length ? { rating, max, attended: history.length, color, history } : null,
    days,
  };
}

const SOURCES = { leetcode, gfg, code360, github, hackerrank, hackerearth, neetcode, interviewbit, codeforces, codechef, atcoder };

// Save what loaded; fill in what didn't from the last save. Never slows the response by more than ~2.5s.
async function withSnapshots(body, context) {
  if (!hasDb()) return;
  const keys = Object.keys(SOURCES);
  const ok = keys.filter((k) => body[k]), failed = keys.filter((k) => !body[k]);
  if (ok.length) {
    const save = db().then((d) =>
      d.collection("live").bulkWrite(ok.map((k) => ({ replaceOne: { filter: { _id: k }, replacement: { data: body[k], at: body.updated }, upsert: true } })))
    ).catch((e) => console.error("stats snapshot save:", e.message));
    context?.waitUntil ? context.waitUntil(save) : await within(save, 2500);
  }
  if (!failed.length) return;
  const saved = await within(db().then((d) => d.collection("live").find({ _id: { $in: failed } }).toArray()), 2500, []);
  for (const s of saved) {
    body[s._id] = s.data;
    (body.snap ??= {})[s._id] = s.at;
  }
}

export default async (req, context) => {
  // Each source can fail on its own; the page falls back to the last saved numbers, then to data.js.
  const keys = Object.keys(SOURCES);
  const results = await Promise.allSettled(keys.map((k) => SOURCES[k]()));
  const body = { updated: new Date().toISOString() };
  keys.forEach((k, i) => (body[k] = results[i].status === "fulfilled" ? results[i].value : null));
  await withSnapshots(body, context);
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      "Netlify-CDN-Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
};

export const config = { path: "/api/stats" };
