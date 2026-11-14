import { MongoClient } from "mongodb";

/*
  MongoDB connection shared by the functions (and scripts/admin.mjs). One client per warm function instance.
  Collections:
    admins    the one login allowed to edit (created with `npm run admin:user`)
    learning  courses on the Learning page: { _id: playlist id, group, title, sub, done, count, focus, order }
    coding    manual corrections to a platform's numbers: { _id: platform, solved, easy, medium, hard }
    contests  contests added by hand (e.g. CodeChef): { platform, name, date, rank, players, solved, of, rating, url }
    live      the last good live stats per platform, used when that platform's API fails: { _id: platform, data, at }
*/
export const hasDb = () => Boolean(process.env.MONGODB_URI);

let ready = null;
export function db() {
  if (!hasDb()) return Promise.reject(new Error("MONGODB_URI is not set"));
  ready ??= new MongoClient(process.env.MONGODB_URI, { maxPoolSize: 3, serverSelectionTimeoutMS: 4000, connectTimeoutMS: 4000 })
    .connect()
    .then((client) => client.db(process.env.MONGODB_DB || "portfolio"))
    .catch((e) => {
      ready = null; // try again on the next request
      throw e;
    });
  return ready;
}

// Resolves to the value, or to `fallback` if it takes longer than `ms` or fails (keeps pages fast when the DB is slow).
export const within = (p, ms, fallback = null) =>
  Promise.race([Promise.resolve(p).catch(() => fallback), new Promise((r) => setTimeout(() => r(fallback), ms))]);

export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers } });
