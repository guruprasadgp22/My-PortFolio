import { useSyncExternalStore } from "react";
import { REDUCED } from "./motion";

// Light / dark theme shared across components. index.html sets the first value before paint.
const root = document.documentElement;
const subs = new Set();
const get = () => root.dataset.theme || "dark";

function apply(t) {
  root.dataset.theme = t;
  try {
    localStorage.setItem("theme", t);
  } catch {}
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "light" ? "#f4ede1" : "#0c0a12");
  subs.forEach((f) => f());
}

// Switches theme with a circular reveal growing from the clicked button (View Transitions API when available).
export function toggleTheme(e) {
  const next = get() === "dark" ? "light" : "dark";
  if (REDUCED || !document.startViewTransition) return apply(next);
  const r = e?.currentTarget?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : innerWidth / 2;
  const y = r ? r.top + r.height / 2 : 0;
  const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const vt = document.startViewTransition(() => apply(next));
  vt.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] },
      { duration: 750, easing: "cubic-bezier(.7,0,.2,1)", pseudoElement: "::view-transition-new(root)" }
    );
  });
}

export default function useTheme() {
  return useSyncExternalStore((f) => (subs.add(f), () => subs.delete(f)), get);
}
