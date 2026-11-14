import { useEffect, useState } from "react";
import { applySections } from "../data";

/*
  What the admin has saved in the database (netlify/functions/content.mjs): every page's content (sections,
  put in place of data.js through applySections), Learning progress, corrections to platform numbers and
  contests added by hand. Like useStats, the last good copy is kept in this browser so a
  repeat visit shows it at once. null until loaded; { failed: true } when there's no database (pages then
  use src/data.js). refreshContent() reloads it, e.g. right after a save in the admin page.
*/
const KEY = "gp-content";
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

let cache = read();
let pending = null;
const same = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});
// before the first render: the saved copy from the last visit, so pages don't flash the built-in content
applySections(cache?.sections);
const subs = new Set();
const emit = () => subs.forEach((f) => f(cache));

export function refreshContent() {
  pending = fetch("/api/content", { cache: "no-store", signal: AbortSignal.timeout?.(8000) })
    .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : null))
    .catch(() => null)
    .then((fresh) => {
      if (fresh) {
        if (!same(fresh.sections, cache?.sections)) applySections(fresh.sections);
        cache = fresh;
        write(fresh);
      } else if (!cache) cache = { failed: true };
      emit();
      return cache;
    });
  return pending;
}

export default function useContent() {
  const [content, setContent] = useState(cache);
  useEffect(() => {
    subs.add(setContent);
    if (!pending) refreshContent();
    return () => subs.delete(setContent);
  }, []);
  return content;
}
