/*
  Every video in a public YouTube playlist, through the official YouTube Data API v3 (YOUTUBE_API_KEY):
  playlistItems 50 at a time, then videos for their lengths. Each lesson is { v: video id, t: title, s: seconds, lc? }.
  Titles are tidied the way the Learning page shows them:
    "Two Sum | Leetcode 1 | Detailed Explanation | @codestorywithMIK" → t "Two Sum", lc 1
  Costs about 2 quota units per 50 videos (the free quota is 10,000 a day), and the result is CDN-cached.
*/
const API = "https://www.googleapis.com/youtube/v3";
// title pieces that are channel tags, not the lesson: "@codestorywithMIK", "AMAZON", "Advanced AI Playlist", "MIK"…
const NOISE = /^(detailed explanation|full explanation|explanation|hindi|hinglish|english|java|c\+\+|python|code ?story ?with ?mik|mik|leetcode|gfg|dsa|video solution|deep dive|live coding|.*\bplaylist\b.*|.*\binterview\b.*|#\S+|concepts & questions.*|story to code|video \d+|.*\bexplanation\b.*|similar to.*|made (super )?easy|detailed( reason)?|binary lifting|dp on trees|segment tree)$/i;
const UPPER = /^[A-Z0-9 &,.-]+$/; // company tags: AMAZON, META, MICROSOFT…
// a piece that only names companies: "Google", "Amazon, Microsoft, Paytm"
const COMPANY = "google|amazon|microsoft|meta|facebook|apple|adobe|paytm|oracle|uber|flipkart|netflix|makemytrip|samsung|goldman sachs|walmart|linkedin|bloomberg|qualcomm|intuit|atlassian|zoho|tcs|infosys|accenture|swiggy|zomato|phonepe|vmware|salesforce|nvidia|de shaw|twitter|yahoo|ola|myntra";
const COMPANIES = new RegExp(`^(?:(?:${COMPANY})\\s*(?:,|&|and)?\\s*)+$`, "i");
const EMOJI = /[\p{Extended_Pictographic}\u{1F3FB}-\u{1F3FF}\u200d\ufe0f\u2795]/gu;

export const hasYouTube = () => !!process.env.YOUTUBE_API_KEY;

export function tidy(raw) {
  const title = String(raw || "").replace(EMOJI, "").replace(/\s+/g, " ").trim();
  const lc = +(title.match(/\bleet ?code\s*[-#:]?\s*(\d{1,4})\b/i)?.[1] || 0) || undefined;
  const parts = title
    .split(/\s*\|\s*/)
    .map((p) =>
      p
        .replace(/\bleet ?code\s*[-#:]?\s*\d{1,4}\b/i, "")
        .replace(/@\S+/g, "")
        .replace(/\s*:\s*explanation\b.*$/i, "") // "Two Sum II : Explanation + Live Coding (In Hinglish)"
        .replace(/\(\s*in \w+\s*\)/gi, "")
        .replace(/\s*-\s*\(.*$/, "") // "3Sum Closest - (Meta, Amazon)Live Coding", "…-(Asked in Indeed)", "… - ()"
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
  // the first piece is the lesson (unless it's only the series name); later pieces are dropped when they're tags
  const [head, ...rest] = NOISE.test(parts[0] || "") && parts.length > 1 ? parts.slice(1) : parts;
  const keep = [head, ...rest.filter((p) => !(p.length > 1 && UPPER.test(p)) && !NOISE.test(p) && !COMPANIES.test(p)).slice(0, 1)].filter(Boolean);
  return { t: (keep.join(" · ") || title).slice(0, 160), ...(lc ? { lc } : {}) };
}

// "PT1H2M10S" → 3730
const seconds = (iso) => {
  const m = String(iso || "").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? ((+m[1] || 0) * 86400 + (+m[2] || 0) * 3600 + (+m[3] || 0) * 60 + (+m[4] || 0)) : 0;
};

async function get(path, params) {
  const q = new URLSearchParams({ ...params, key: process.env.YOUTUBE_API_KEY });
  const res = await fetch(`${API}/${path}?${q}`, { signal: AbortSignal.timeout(8000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error?.message || `youtube → ${res.status}`), { status: res.status });
  return body;
}

export async function playlist(list, { max = 1000 } = {}) {
  const items = [];
  let pageToken;
  do {
    const page = await get("playlistItems", { part: "snippet", playlistId: list, maxResults: 50, ...(pageToken ? { pageToken } : {}) });
    items.push(...(page.items || []));
    pageToken = page.nextPageToken;
  } while (pageToken && items.length < max);
  // deleted and private videos stay in a playlist without a title we can show
  const videos = items
    .map((i) => ({ v: i.snippet?.resourceId?.videoId, title: i.snippet?.title, pos: i.snippet?.position ?? 0 }))
    .filter((x) => x.v && !/^(Deleted|Private) video$/.test(x.title))
    .sort((a, b) => a.pos - b.pos);
  const length = {};
  for (let i = 0; i < videos.length; i += 50) {
    const page = await get("videos", { part: "contentDetails", id: videos.slice(i, i + 50).map((x) => x.v).join(","), maxResults: 50 });
    for (const x of page.items || []) length[x.id] = seconds(x.contentDetails?.duration);
  }
  const lessons = videos.map((x) => ({ v: x.v, ...tidy(x.title), s: length[x.v] || 0 }));
  return { count: lessons.length, lessons };
}
