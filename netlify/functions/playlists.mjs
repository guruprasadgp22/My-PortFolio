import { db, hasDb, json, within } from "../lib/db.mjs";
import { hasYouTube, playlist } from "../lib/youtube.mjs";

/*
  Public: the video list of every course on the Learning page, read from YouTube (official Data API,
  YOUTUBE_API_KEY), so a playlist added in the admin page gets its lessons, "next up" and hours by itself.
    { updated, lists: { <playlistId>: { count, lessons: [{ v, t, s, lc? }] } } }
  Only the playlists saved in the database are fetched, never one named in the request. Cached at Netlify's
  edge for a day under the "content" tag, so saving in the admin page refreshes it. A playlist that fails is
  left out and the page falls back to its built-in copy (src/learning.json).
*/
export default async () => {
  if (!hasYouTube()) return json({ error: "No YouTube API key configured" }, 503);
  if (!hasDb()) return json({ error: "No database configured" }, 503);
  const ids = await within(
    db().then((d) => d.collection("learning").find({}, { projection: { _id: 1 } }).limit(30).toArray()).then((r) => r.map((x) => x._id)),
    4000,
    null
  );
  if (!ids) return json({ error: "Database unavailable" }, 503);
  const results = await Promise.allSettled(ids.map((id) => playlist(id)));
  const lists = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled") lists[ids[i]] = r.value;
    else console.error("playlist", ids[i], r.reason?.message);
  });
  const ok = Object.keys(lists).length > 0 || !ids.length;
  return json({ updated: new Date().toISOString(), lists }, 200, {
    "Cache-Control": "public, max-age=0, must-revalidate",
    // a full answer is kept for a day; if YouTube failed for everything, only for a few minutes
    "Netlify-CDN-Cache-Control": ok ? "public, s-maxage=86400, stale-while-revalidate=604800" : "public, s-maxage=300",
    "Netlify-Cache-Tag": "content",
  });
};

export const config = { path: "/api/playlists" };
