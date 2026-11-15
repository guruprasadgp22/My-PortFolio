import { useEffect, useMemo, useState } from "react";
import useContent from "./useContent";

/*
  Live coding stats from the Netlify Function (netlify/functions/stats.mjs).
  - Instant: the last good response is kept in this browser, so a repeat visit shows real numbers straight away
    and refreshes them quietly in the background.
  - Graceful: if one platform fails, its last known numbers are kept and marked with when they're from
    (stats.stale = { gfg: "2026-10-21T…" }), instead of dropping back to zero or an error.
  - Saved by the server: a platform answered from the database's last good copy (fresh.snap) counts as stale too.
  - Corrected by hand: numbers set in the admin page (useContent().coding) replace the live ones.
  Shared by every component; null until something is available, so pages fall back to data.js.
*/
const KEY = "gp-stats";
const PLATFORMS = ["leetcode", "gfg", "code360", "github", "hackerrank", "hackerearth", "neetcode", "interviewbit", "codeforces", "codechef", "atcoder"];

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
    const snap = fresh.snap?.[k];
    if (fresh[k] && !(snap && saved?.[k] && saved.at?.[k] > snap)) {
      out[k] = fresh[k];
      out.at[k] = snap || fresh.updated;
      if (snap) out.stale[k] = snap;
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

// Lay the admin's corrections over the live numbers (only the fields that were set).
function corrected(stats, fixes) {
  if (!stats || stats.failed || !fixes || !Object.keys(fixes).length) return stats;
  const out = { ...stats };
  for (const [k, f] of Object.entries(fixes)) {
    if (!Object.keys(f).length) continue;
    const live = stats[k] || {};
    out[k] = { ...live, ...f, corrected: true };
    // a corrected total no longer matches the live split by difficulty (GFG, Code360), so drop that split
    if (f.solved != null && f.solved !== live.solved) {
      out[k].levels = null;
      for (const lvl of ["Easy", "Moderate", "Hard", "Ninja"]) delete out[k][lvl];
    }
    // multi-account platforms: the totals come from the busiest account, so correct that account too
    if (Array.isArray(live.accounts)) {
      const i = live.accounts.findIndex((a) => a.user === live.top || a.solved === live.solved);
      if (i >= 0) out[k].accounts = live.accounts.map((a, j) => (j === i ? { ...a, ...f } : a));
    }
  }
  return out;
}

// The live numbers as loaded, without corrections (the admin page compares against these).
export function useLiveStats() {
  const [stats, setStats] = useState(cache);
  useEffect(() => {
    subs.add(setStats);
    load();
    return () => subs.delete(setStats);
  }, []);
  return stats;
}

export default function useStats() {
  const [stats, setStats] = useState(cache);
  const content = useContent();
  useEffect(() => {
    subs.add(setStats);
    load();
    return () => subs.delete(setStats);
  }, []);
  return useMemo(() => corrected(stats, content?.coding), [stats, content]);
}
