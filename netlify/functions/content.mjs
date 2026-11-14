import { db, hasDb, json } from "../lib/db.mjs";

/*
  Public, read-only: what the admin has saved, for the site to show.
    sections  page content edited in the admin page, in place of the built-in copy in src/data.js
    learning  courses and progress for the Learning page
    coding    manual corrections laid over the live platform numbers
    contests  contests added by hand (platforms without a live API)
  Cached at Netlify's edge for a minute; saving in the admin page clears it straight away (cache tag "content").
  Without a database this answers 503, and the site keeps using the numbers in src/data.js.
*/
export default async () => {
  if (!hasDb()) return json({ error: "No database configured" }, 503);
  try {
    const d = await db();
    const [sections, learning, coding, contests] = await Promise.all([
      d.collection("sections").find({}, { projection: { data: 1 } }).toArray(),
      d.collection("learning").find({}, { projection: { updatedAt: 0 } }).sort({ group: 1, order: 1, _id: 1 }).toArray(),
      d.collection("coding").find({}, { projection: { updatedAt: 0 } }).toArray(),
      d.collection("contests").find({}, { projection: { updatedAt: 0 } }).sort({ date: 1 }).limit(500).toArray(),
    ]);
    const updated = await d.collection("meta").findOne({ _id: "content" });
    return json(
      {
        updated: updated?.at || null,
        sections: Object.fromEntries(sections.map((s) => [s._id, s.data])),
        learning: learning.map(({ _id, ...c }) => ({ list: _id, ...c })),
        coding: Object.fromEntries(coding.map(({ _id, ...c }) => [_id, Object.fromEntries(Object.entries(c).filter(([, v]) => v != null))])),
        contests: contests.map(({ _id, ...c }) => ({ id: String(_id), ...c })),
      },
      200,
      {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Netlify-CDN-Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "Netlify-Cache-Tag": "content",
      }
    );
  } catch (e) {
    console.error("content:", e.message);
    return json({ error: "Database unavailable" }, 503);
  }
};

export const config = { path: "/api/content" };
