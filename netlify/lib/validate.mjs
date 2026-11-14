/*
  Input checks for everything the admin can save. Each cleaner returns { value } with only the known fields,
  or { error } with a message to show next to the form. Unknown fields are dropped, never stored.
*/
export const GROUPS = ["ai", "dsa", "other"];
export const CODING = ["leetcode", "gfg", "code360", "hackerrank", "hackerearth", "neetcode", "interviewbit", "codeforces"];
export const CODING_FIELDS = ["solved", "easy", "medium", "hard"];

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
// a whole number in range, null when empty; NaN when it's something else
function int(v, min = 0, max = 1e7) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : NaN;
}
const bad = (o) => Object.entries(o).find(([, v]) => Number.isNaN(v));

// "https://youtube.com/playlist?list=PL…&si=…" or a bare id → the id
export function playlistId(v) {
  const s = str(v, 300);
  const m = s.match(/[?&]list=([\w-]+)/) || s.match(/^([\w-]{10,64})$/);
  return m ? m[1] : null;
}

export function cleanLearning(b, { partial = false } = {}) {
  const out = {};
  if (!partial || "title" in b) {
    out.title = str(b.title, 120);
    if (!out.title) return { error: "Title is required" };
  }
  if ("sub" in b) out.sub = str(b.sub, 160);
  if (!partial || "group" in b) {
    out.group = b.group;
    if (!GROUPS.includes(out.group)) return { error: `Group must be one of ${GROUPS.join(", ")}` };
  }
  const nums = {};
  if ("done" in b || !partial) nums.done = int(b.done ?? 0, 0, 5000);
  if ("count" in b || !partial) nums.count = int(b.count, 1, 5000);
  if ("order" in b) nums.order = int(b.order, 0, 999);
  const wrong = bad(nums);
  if (wrong) return { error: `${wrong[0]} must be a whole number` };
  if (!partial && nums.count == null) return { error: "Total lessons is required" };
  Object.assign(out, Object.fromEntries(Object.entries(nums).filter(([, v]) => v !== null)));
  if (out.done != null && out.count != null && out.done > out.count) return { error: "Lessons done can't be more than the total" };
  if ("focus" in b) {
    const list = Array.isArray(b.focus) ? b.focus : String(b.focus || "").split(",");
    out.focus = list.map((f) => str(f, 40)).filter(Boolean).slice(0, 12);
  }
  return { value: out };
}

// Every field optional: an empty field means "use the live number".
export function cleanCoding(b) {
  const out = {};
  for (const k of CODING_FIELDS) out[k] = int(b[k], 0, 100000);
  const wrong = bad(out);
  if (wrong) return { error: `${wrong[0]} must be a whole number` };
  return { value: out };
}

export function cleanContest(b) {
  const platform = str(b.platform, 30);
  const name = str(b.name, 140);
  const date = str(b.date, 10);
  if (!platform) return { error: "Platform is required" };
  if (!name) return { error: "Contest name is required" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { error: "Date must be YYYY-MM-DD" };
  const nums = { rank: int(b.rank, 1), players: int(b.players, 1), solved: int(b.solved, 0, 100), of: int(b.of, 1, 100), rating: int(b.rating, 0, 5000) };
  const wrong = bad(nums);
  if (wrong) return { error: `${wrong[0]} must be a whole number` };
  if (nums.rank && nums.players && nums.rank > nums.players) return { error: "Rank can't be more than the number of participants" };
  if (nums.solved != null && nums.of != null && nums.solved > nums.of) return { error: "Solved can't be more than the number of problems" };
  let url = str(b.url, 300) || null;
  if (url && !/^https:\/\/[^\s]+$/.test(url)) return { error: "Link must start with https://" };
  return { value: { platform, name, date, ...nums, url } };
}

// Page sections (src/data.js) the admin can replace, and whether each is a list or a single object.
export const SECTION_TYPES = {
  ME: "object", ABOUT: "object", DOING: "array", EXPERIENCE: "array", EDUCATION: "array", CERTIFICATIONS: "array",
  JOURNEY: "array", JOURNEY_MAP: "array", SKILLS: "array", PROJECTS: "array", PLATFORMS: "array", FESTIVALS: "array",
};
const MAX_SECTION = 300 * 1024; // bytes of JSON; the biggest built-in section (Projects) is ~18 KB
// "$…" would read as a MongoDB operator; dots are fine (MongoDB 5+ stores them, and skills like "React.js" need them)
const BAD_KEY = /^\$|^(__proto__|constructor|prototype)$/;
// a script link, even with spaces or control characters hidden in it (browsers drop those); plain words like "JavaScript" are fine
const BAD_URL = /^(javascript|vbscript):|^data:text\/html/i;
const badUrl = (v) => BAD_URL.test(v.replace(/[\s\u0000-\u001f]/g, ""));

// Plain JSON only (no operators, odd keys or script links), nesting at most 8 deep, strings up to 20k characters.
function plain(v, depth, path) {
  if (depth > 8) return `${path} is nested too deeply`;
  if (v === null || typeof v === "boolean") return null;
  if (typeof v === "number") return Number.isFinite(v) ? null : `${path} must be a real number`;
  if (typeof v === "string") return v.length > 20000 ? `${path} is too long` : badUrl(v) ? `${path} has a link type that isn't allowed` : null;
  if (Array.isArray(v)) {
    if (v.length > 500) return `${path} has too many items`;
    for (let i = 0; i < v.length; i++) {
      const e = plain(v[i], depth + 1, `${path}[${i}]`);
      if (e) return e;
    }
    return null;
  }
  if (typeof v === "object") {
    if (Object.getPrototypeOf(v) !== Object.prototype) return `${path} isn't plain data`;
    for (const [k, x] of Object.entries(v)) {
      if (BAD_KEY.test(k) || k.length > 60) return `${path} has a field name that isn't allowed ("${k.slice(0, 20)}")`;
      const e = plain(x, depth + 1, `${path}.${k}`);
      if (e) return e;
    }
    return null;
  }
  return `${path} has a value that isn't allowed`;
}

export function cleanSection(key, data) {
  const type = SECTION_TYPES[key];
  if (!type) return { error: "Unknown section" };
  if ((type === "array") !== Array.isArray(data) || data === null || typeof data !== "object") return { error: `${key} must be a ${type === "array" ? "list" : "single object"}` };
  if (JSON.stringify(data).length > MAX_SECTION) return { error: "That's too much content for one section" };
  const e = plain(data, 0, key);
  return e ? { error: e } : { value: data };
}

// Uploaded images: WebP or JPEG only (the admin page converts everything to one of them in the browser).
// SVG is refused on purpose: it can carry script, and these are served from the site's own address.
const MAX_FULL = 3 * 1024 * 1024, MAX_SMALL = 800 * 1024;
const kindOf = (b) =>
  b.length > 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" ? "image/webp"
    : b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff ? "image/jpeg" : null;

export function cleanImage(b) {
  const name = str(b?.name, 120) || "image";
  const full = typeof b?.full === "string" ? Buffer.from(b.full, "base64") : null;
  const small = typeof b?.small === "string" && b.small ? Buffer.from(b.small, "base64") : null;
  if (!full?.length) return { error: "No image received" };
  if (full.length > MAX_FULL) return { error: "Image is too big after compressing (over 3 MB)" };
  if (small && small.length > MAX_SMALL) return { error: "Small copy is too big" };
  const type = kindOf(full);
  if (!type || (small && kindOf(small) !== type)) return { error: "Only photos and screenshots can be uploaded (PNG, JPG, WebP, GIF)" };
  const w = int(b.w, 1, 10000), h = int(b.h, 1, 10000);
  if (!w || !h || Number.isNaN(w) || Number.isNaN(h)) return { error: "Missing image size" };
  return { value: { name, type, w, h, full, small, bytes: full.length } };
}
