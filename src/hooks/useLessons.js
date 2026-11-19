import { useEffect, useState } from "react";

/*
  Each Learning playlist's videos as YouTube has them now (/api/playlists, netlify/functions/playlists.mjs):
  { <playlistId>: { count, lessons } }. The last good answer is kept in this browser so a repeat visit shows the
  lists at once; null until something is available, and the page then uses its built-in copy (learning.json).
*/
const KEY = "gp-lessons";
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY))?.lists || null;
  } catch {
    return null;
  }
};

let cache = read();
let pending = null;
const load = () =>
  (pending ??= fetch("/api/playlists", { signal: AbortSignal.timeout?.(12000) })
    .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : null))
    .catch(() => null)
    .then((d) => {
      if (d?.lists && Object.keys(d.lists).length) {
        cache = d.lists;
        try {
          localStorage.setItem(KEY, JSON.stringify(d));
        } catch {}
      }
      return cache;
    }));

export default function useLessons() {
  const [lists, setLists] = useState(cache);
  useEffect(() => {
    let on = true;
    load().then((v) => on && v && setLists(v));
    return () => (on = false);
  }, []);
  return lists;
}
