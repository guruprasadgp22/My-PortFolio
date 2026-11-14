import { ObjectId } from "mongodb";
import { db, hasDb } from "../lib/db.mjs";

/*
  Images uploaded in the admin page, stored in MongoDB (collection "images"):
    /api/img/<id>             the full image (up to 1600px wide)
    /api/img/<id>?size=small  a 640px copy for phones (the full one if the image is already small)
  An image never changes once uploaded (a new upload gets a new id), so browsers and Netlify's CDN keep it for a year.
*/
const notFound = () => new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain", "Cache-Control": "public, max-age=60" } });

export default async (req) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  if (!hasDb() || !ObjectId.isValid(id) || String(new ObjectId(id)) !== id) return notFound();
  const small = url.searchParams.get("size") === "small";
  try {
    const d = await db();
    const doc = await d.collection("images").findOne({ _id: new ObjectId(id) }, { projection: { type: 1, full: 1, small: 1 } });
    if (!doc) return notFound();
    const bin = small && doc.small ? doc.small : doc.full;
    return new Response(Buffer.from(bin.buffer), {
      headers: {
        "Content-Type": doc.type,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (e) {
    console.error("img:", e.message);
    return new Response("Unavailable", { status: 503, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } });
  }
};

export const config = { path: "/api/img/*" };
