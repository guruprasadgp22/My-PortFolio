import { useEffect, useState } from "react";

// Live coding stats from the Netlify Function (netlify/functions/stats.mjs).
// Fetched once per visit and shared; null until it arrives or if it fails, so pages fall back to data.js.
let cache = null;
let pending = null;

function load() {
  pending ??= fetch("/api/stats", { signal: AbortSignal.timeout?.(9000) })
    .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : null))
    .catch(() => null)
    .then((d) => (cache = d));
  return pending;
}

export default function useStats() {
  const [stats, setStats] = useState(cache);
  useEffect(() => {
    if (!cache) load().then(setStats);
  }, []);
  return stats;
}
