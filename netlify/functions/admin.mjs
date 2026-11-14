import { ObjectId } from "mongodb";
import { purgeCache } from "@netlify/functions";
import { db, hasDb, json } from "../lib/db.mjs";
import { clearCookie, COOKIE, DUMMY_HASH, getCookie, readToken, sessionCookie, signToken, verifyPassword } from "../lib/auth.mjs";
import { cleanCoding, cleanContest, cleanImage, cleanLearning, cleanSection, CODING, playlistId, SECTION_TYPES } from "../lib/validate.mjs";

/*
  Admin API for the one user who can edit the site's data (the #admin page).
    POST   /api/admin/login            { username, password }  → sets the session cookie
    POST   /api/admin/logout
    GET    /api/admin/me               who is signed in
    GET    /api/admin/data             everything editable
    POST   /api/admin/learning         add a course            PUT/DELETE /api/admin/learning/:playlistId
    POST   /api/admin/learning/import  copy the site's built-in courses in (only when empty)
    PUT    /api/admin/coding/:platform set corrections          DELETE clears them
    POST   /api/admin/contests         add a contest           PUT/DELETE /api/admin/contests/:id
    PUT    /api/admin/sections/:KEY    replace a page section  { data }   DELETE goes back to the built-in copy
    GET    /api/admin/images           uploaded images         POST uploads one, DELETE /api/admin/images/:id (if unused)
  Safety: every change needs the signed session cookie (HttpOnly, SameSite=Strict) and the X-GP-Admin header,
  which a page on another site can't send; 5 wrong passwords lock the login for 15 minutes.
*/
const MAX_FAILS = 5, LOCK_MIN = 15;

async function signedIn(req, d) {
  const t = readToken(getCookie(req, COOKIE));
  if (!t) return null;
  const user = await d.collection("admins").findOne({ _id: t.u }, { projection: { version: 1 } });
  return user && (user.version || 0) === t.v ? t.u : null;
}

// Mark the content as changed and clear the edge cache, so the site shows the edit within seconds.
async function touched(d) {
  await d.collection("meta").updateOne({ _id: "content" }, { $set: { at: new Date().toISOString() } }, { upsert: true });
  try {
    await purgeCache({ tags: ["content"] });
  } catch {} // not running on Netlify (local tests): nothing to purge
}

async function login(req, d) {
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Send a username and password" }, 400);
  }
  const username = String(body.username || "").trim().toLowerCase().slice(0, 60);
  const password = String(body.password || "").slice(0, 200);
  const admins = d.collection("admins");
  const user = username ? await admins.findOne({ _id: username }) : null;
  if (user?.lockUntil && user.lockUntil > Date.now()) {
    return json({ error: `Too many wrong tries. Try again in ${Math.ceil((user.lockUntil - Date.now()) / 60000)} min.` }, 429);
  }
  const ok = await verifyPassword(password, user?.hash || DUMMY_HASH);
  if (!user || !ok) {
    if (user) {
      const fails = (user.fails || 0) + 1;
      await admins.updateOne({ _id: user._id }, { $set: fails >= MAX_FAILS ? { fails: 0, lockUntil: Date.now() + LOCK_MIN * 60e3 } : { fails } });
    }
    await new Promise((r) => setTimeout(r, 400));
    return json({ error: "Wrong username or password" }, 401);
  }
  await admins.updateOne({ _id: user._id }, { $set: { fails: 0, lockUntil: null, lastLogin: new Date() } });
  return json({ user: user._id }, 200, { "Set-Cookie": sessionCookie(signToken(user._id, user.version || 0)) });
}

async function readBody(req) {
  try {
    const b = await req.json();
    return b && typeof b === "object" && !Array.isArray(b) ? b : null;
  } catch {
    return null;
  }
}

export default async (req) => {
  if (!hasDb() || !process.env.ADMIN_SECRET) return json({ error: "The database isn't set up yet (MONGODB_URI / ADMIN_SECRET)" }, 503);
  const url = new URL(req.url);
  const [section, id] = url.pathname.replace(/^\/api\/admin\/?/, "").split("/").map(decodeURIComponent);
  const method = req.method;

  // changes must come from this site's own admin page
  if (method !== "GET") {
    const origin = req.headers.get("origin");
    if (req.headers.get("x-gp-admin") !== "1" || (origin && origin !== url.origin)) return json({ error: "Forbidden" }, 403);
  }

  let d;
  try {
    d = await db();
  } catch (e) {
    console.error("admin db:", e.message);
    return json({ error: "Can't reach the database" }, 503);
  }

  if (section === "login" && method === "POST") return login(req, d);
  if (section === "logout" && method === "POST") return json({ ok: true }, 200, { "Set-Cookie": clearCookie() });

  const user = await signedIn(req, d);
  if (!user) return json({ error: "Please sign in" }, 401);
  if (section === "me") return json({ user });

  const learning = d.collection("learning"), coding = d.collection("coding"), contests = d.collection("contests"), sections = d.collection("sections");
  const now = new Date();

  if (section === "data" && method === "GET") {
    const [s, l, c, k] = await Promise.all([
      sections.find().toArray(),
      learning.find().sort({ group: 1, order: 1, _id: 1 }).toArray(),
      coding.find().toArray(),
      contests.find().sort({ date: -1 }).toArray(),
    ]);
    return json({
      sections: Object.fromEntries(s.map((x) => [x._id, { data: x.data, updatedAt: x.updatedAt }])),
      learning: l.map(({ _id, ...x }) => ({ list: _id, ...x })),
      coding: Object.fromEntries(c.map(({ _id, ...x }) => [_id, x])),
      contests: k.map(({ _id, ...x }) => ({ id: String(_id), ...x })),
    });
  }

  if (section === "learning") {
    // copy the courses built into the site (sent by the admin page) into an empty collection
    if (id === "import" && method === "POST") {
      if (await learning.countDocuments()) return json({ error: "There are already courses in the database" }, 409);
      const b = await readBody(req);
      const docs = [];
      for (const [i, t] of (Array.isArray(b?.courses) ? b.courses : []).slice(0, 50).entries()) {
        const list = playlistId(t.list), r = cleanLearning(t);
        if (!list || r.error) return json({ error: `Course ${i + 1}: ${r.error || "bad playlist id"}` }, 400);
        docs.push({ _id: list, ...r.value, order: r.value.order ?? i, updatedAt: now });
      }
      if (!docs.length) return json({ error: "Nothing to import" }, 400);
      await learning.insertMany(docs);
      await touched(d);
      return json({ imported: docs.length });
    }
    if (method === "POST" && !id) {
      const b = await readBody(req);
      const list = playlistId(b?.list);
      if (!list) return json({ error: "Paste the YouTube playlist link (or its id)" }, 400);
      const r = cleanLearning(b);
      if (r.error) return json({ error: r.error }, 400);
      if (await learning.findOne({ _id: list })) return json({ error: "That playlist is already on the page" }, 409);
      const order = r.value.order ?? (await learning.countDocuments({ group: r.value.group }));
      await learning.insertOne({ _id: list, focus: [], sub: "", ...r.value, order, updatedAt: now });
      await touched(d);
      return json({ ok: true, list });
    }
    if (id && method === "PUT") {
      const b = await readBody(req);
      const r = cleanLearning(b || {}, { partial: true });
      if (r.error) return json({ error: r.error }, 400);
      const cur = await learning.findOne({ _id: id });
      if (!cur) return json({ error: "Course not found" }, 404);
      if ((r.value.done ?? cur.done) > (r.value.count ?? cur.count)) return json({ error: "Lessons done can't be more than the total" }, 400);
      await learning.updateOne({ _id: id }, { $set: { ...r.value, updatedAt: now } });
      await touched(d);
      return json({ ok: true });
    }
    if (id && method === "DELETE") {
      const r = await learning.deleteOne({ _id: id });
      if (!r.deletedCount) return json({ error: "Course not found" }, 404);
      await touched(d);
      return json({ ok: true });
    }
  }

  if (section === "coding" && id) {
    if (!CODING.includes(id)) return json({ error: "Unknown platform" }, 400);
    if (method === "PUT") {
      const r = cleanCoding((await readBody(req)) || {});
      if (r.error) return json({ error: r.error }, 400);
      if (Object.values(r.value).every((v) => v == null)) await coding.deleteOne({ _id: id });
      else await coding.updateOne({ _id: id }, { $set: { ...r.value, updatedAt: now } }, { upsert: true });
      await touched(d);
      return json({ ok: true });
    }
    if (method === "DELETE") {
      await coding.deleteOne({ _id: id });
      await touched(d);
      return json({ ok: true });
    }
  }

  if (section === "contests") {
    if (method === "POST" && !id) {
      const r = cleanContest((await readBody(req)) || {});
      if (r.error) return json({ error: r.error }, 400);
      const { insertedId } = await contests.insertOne({ ...r.value, updatedAt: now });
      await touched(d);
      return json({ ok: true, id: String(insertedId) });
    }
    if (id && (method === "PUT" || method === "DELETE")) {
      if (!ObjectId.isValid(id)) return json({ error: "Contest not found" }, 404);
      const _id = new ObjectId(id);
      if (method === "DELETE") {
        const r = await contests.deleteOne({ _id });
        if (!r.deletedCount) return json({ error: "Contest not found" }, 404);
      } else {
        const r = cleanContest((await readBody(req)) || {});
        if (r.error) return json({ error: r.error }, 400);
        const u = await contests.updateOne({ _id }, { $set: { ...r.value, updatedAt: now } });
        if (!u.matchedCount) return json({ error: "Contest not found" }, 404);
      }
      await touched(d);
      return json({ ok: true });
    }
  }

  if (section === "images") {
    const images = d.collection("images");
    if (method === "GET" && !id) {
      const list = await images.find({}, { projection: { full: 0, small: 0 } }).sort({ createdAt: -1 }).limit(300).toArray();
      return json({ images: list.map(({ _id, ...x }) => ({ id: String(_id), url: `/api/img/${_id}`, ...x })) });
    }
    if (method === "POST" && !id) {
      const r = cleanImage(await readBody(req));
      if (r.error) return json({ error: r.error }, 400);
      const { insertedId } = await images.insertOne({ ...r.value, createdAt: now });
      return json({ ok: true, id: String(insertedId), url: `/api/img/${insertedId}` });
    }
    if (id && method === "DELETE") {
      if (!ObjectId.isValid(id)) return json({ error: "Image not found" }, 404);
      // refuse while a page still shows it, so deleting can't leave a broken picture on the site
      const used = (await sections.find({}, { projection: { _id: 1, data: 1 } }).toArray()).filter((s) => JSON.stringify(s.data).includes(`/api/img/${id}`));
      if (used.length) return json({ error: `Still used in ${used.map((s) => s._id).join(", ")}. Remove it there first.` }, 409);
      const r = await images.deleteOne({ _id: new ObjectId(id) });
      if (!r.deletedCount) return json({ error: "Image not found" }, 404);
      return json({ ok: true });
    }
  }

  if (section === "sections" && id) {
    if (!SECTION_TYPES[id]) return json({ error: "Unknown section" }, 400);
    if (method === "PUT") {
      const b = await readBody(req);
      const r = cleanSection(id, b?.data);
      if (r.error) return json({ error: r.error }, 400);
      await sections.replaceOne({ _id: id }, { data: r.value, updatedAt: now }, { upsert: true });
      await touched(d);
      return json({ ok: true });
    }
    if (method === "DELETE") {
      await sections.deleteOne({ _id: id });
      await touched(d);
      return json({ ok: true });
    }
  }

  return json({ error: "Not found" }, 404);
};

export const config = { path: ["/api/admin", "/api/admin/*"] };
