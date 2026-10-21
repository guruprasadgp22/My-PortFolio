import { useEffect, useState } from "react";

/*
  Live coding stats from the Netlify Function (netlify/functions/stats.mjs).
  - Instant: the last good response is kept in this browser, so a repeat visit shows real numbers straight away
    and refreshes them quietly in the background.
  - Graceful: if one platform fails, its last known numbers are kept and marked with when they're from
    (stats.stale = { gfg: "2026-10-21T…" }), instead of dropping back to zero or an error.
  Shared by every component; null until something is available, so pages fall back to data.js.
*/
const KEY = "gp-stats";
const PLATFORMS = ["leetcode", "gfg", "code360", "github", "hackerrank", "hackerearth", "neetcode", "interviewbit"];

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
};
const write = (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {}
};

// Saved shape: { updated, at: { gfg: iso, … }, gfg: {...}, … } (at = when each platform last loaded fine)
function merge(saved, fresh) {
  const out = { updated: fresh.updated, at: { ...(saved?.at || {}) }, stale: {} };
  for (const k of PLATFORMS) {
    if (fresh[k]) {
      out[k] = fresh[k];
      out.at[k] = fresh.updated;
    } else if (saved?.[k]) {
      out[k] = saved[k];
      out.stale[k] = saved.at?.[k] || saved.updated;
    } else out[k] = null;
  }
  return out;
}

const saved = read();
let cache = saved ? { ...saved, stale: saved.stale || {}, cached: true } : null;
let pending = null;
const subs = new Set();

function load() {
  pending ??= fetch("/api/stats", { signal: AbortSignal.timeout?.(9000) })
    .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : null))
    .catch(() => null)
    .then((fresh) => {
      if (!fresh) {
        // nothing live and nothing saved: say so, so loading placeholders give way to the data.js numbers
        if (!cache) (cache = { failed: true }), subs.forEach((f) => f(cache));
        return cache;
      }
      const { stale: _s, cached: _c, failed: _f, ...prev } = cache || {};
      cache = merge(prev, fresh);
      const { stale: _st, ...keep } = cache;
      write(keep);
      subs.forEach((f) => f(cache));
      return cache;
    });
  return pending;
}

export default function useStats() {
  const [stats, setStats] = useState(cache);
  useEffect(() => {
    subs.add(setStats);
    load();
    return () => subs.delete(setStats);
  }, []);
  return stats;
}
