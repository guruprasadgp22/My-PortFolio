// Live coding stats for the Coding page: LeetCode, GeeksforGeeks and Code360, fetched server-side
// (their APIs block browser requests) and cached on Netlify's CDN for 6 hours.
const USERS = { leetcode: "guruprasadgp22", gfg: "guruprasadgp22", code360: "guruprasadgp" };
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

async function gfg() {
  const { data } = await getJson(`https://authapi.geeksforgeeks.org/api-get/user-profile-info/?handle=${USERS.gfg}`);
  return { solved: data.total_problems_solved, score: data.score, instituteRank: data.institute_rank, streak: data.pod_solved_longest_streak };
}

async function code360() {
  const { data } = await getJson(
    `https://www.naukri.com/code360/api/v3/public_section/profile/user_details?uuid=${USERS.code360}&request_differentiator=1&app_context=publicsection&naukri_request=true`
  );
  const levels = Object.fromEntries((data.dsa_domain_data?.problem_count_data?.difficulty_data || []).map((d) => [d.level, d.count]));
  return { solved: data.dsa_domain_data?.problem_count_data?.total_count ?? 0, ...levels };
}

export default async () => {
  // Each source can fail on its own; the page falls back to the numbers in data.js for that card.
  const [lc, g, c] = await Promise.allSettled([leetcode(), gfg(), code360()]);
  const pick = (r) => (r.status === "fulfilled" ? r.value : null);
  const body = { updated: new Date().toISOString(), leetcode: pick(lc), gfg: pick(g), code360: pick(c) };
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
      "Netlify-CDN-Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
    },
  });
};

export const config = { path: "/api/stats" };
