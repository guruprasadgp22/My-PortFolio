import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { NAV } from "./data";
import { REDUCED } from "./hooks/motion";
import useSmoothScroll, { jumpTop } from "./hooks/useSmoothScroll";
import Boot from "./components/Boot";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import About from "./components/About";
import Overlays, { openPalette, openShortcuts } from "./components/Overlays";
import Chat from "./components/Chat";
import Skeleton from "./components/Skeleton";
import Festive from "./components/Festive";
import Intro from "./components/Intro";

// About ships with the first load. Every other tab is its own small file, fetched when the browser is idle
// (so switching tabs is still instant) or the moment it's opened, whichever comes first.
const LOADERS = {
  experience: () => import("./components/Experience"),
  education: () => import("./components/Education"),
  journey: () => import("./components/Journey"),
  skills: () => import("./components/Skills"),
  projects: () => import("./components/Projects"),
  coding: () => import("./components/Coding"),
  contact: () => import("./components/Contact"),
};
const PAGES = { about: About, ...Object.fromEntries(Object.entries(LOADERS).map(([id, load]) => [id, lazy(load)])) };
// "#projects/job-board" opens the Projects tab; the part after the slash is for the page itself.
const fromHash = () => {
  const id = location.hash.slice(1).split("/")[0];
  return PAGES[id] ? id : NAV[0][0];
};
const typing = (e) => e.target.closest?.("input, textarea, select, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey;
const BUILT = new Date(__BUILD_DATE__).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const COVER = 420; // ms the curtain takes to sweep in before the page swaps

/*
  Layout: profile sidebar + one content card that swaps pages (the active page lives in the URL hash).
  Changing page plays an "old TV channel change": a grainy ember curtain sweeps across, the page swaps
  underneath, the curtain sweeps away, and a channel OSD flashes in the corner.
*/
export default function App() {
  useSmoothScroll();
  const [page, setPage] = useState(fromHash);
  const pageRef = useRef(page);
  pageRef.current = page;
  const [phase, setPhase] = useState("idle"); // idle | cover | reveal
  const [osd, setOsd] = useState(null);
  const timers = useRef([]);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const show = (id) => {
    clear();
    if (REDUCED) {
      setPage(id);
      jumpTop();
      return;
    }
    setPhase("cover");
    later(() => {
      setPage(id);
      jumpTop();
      setPhase("reveal");
      const n = NAV.findIndex(([p]) => p === id) + 1;
      setOsd({ n, label: NAV[n - 1][1], key: Date.now() });
    }, COVER);
    later(() => setPhase("idle"), COVER + 650);
    later(() => setOsd(null), COVER + 1800);
  };

  // fetch the other tabs in the background once the first screen is done
  useEffect(() => {
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1500));
    const id = idle(() => Object.values(LOADERS).forEach((load) => load()));
    return () => (window.cancelIdleCallback || clearTimeout)(id);
  }, []);

  // Keyboard shortcuts: 1–8 open a tab, / opens search, ? lists the shortcuts (← → are handled by Projects).
  useEffect(() => {
    const key = (e) => {
      if (typing(e) || document.querySelector('[aria-modal="true"]')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= NAV.length) go(NAV[n - 1][0]);
      else if (e.key === "/") (e.preventDefault(), openPalette());
      else if (e.key === "?") (e.preventDefault(), openShortcuts());
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });

  useEffect(() => {
    // a hash change inside the same tab (e.g. #projects/job-board → #projects/flightwise-ai) isn't a page change
    const onHash = () => fromHash() !== pageRef.current && show(fromHash());
    addEventListener("hashchange", onHash);
    return () => {
      removeEventListener("hashchange", onHash);
      clear();
    };
  }, []);

  const go = (id) => {
    if (id === page && phase === "idle") return;
    history.pushState(null, "", `#${id}`);
    show(id);
  };

  // Phones: swipe left / right on the content to move between tabs, like OxygenOS.
  const touch = useRef(null);
  const onTouchStart = (e) => {
    const t = e.touches[0];
    // ignore gestures that start on things that scroll sideways or take input
    if (e.touches.length > 1 || e.target.closest("input, textarea, .heatgrid, .skill-marquee, .mapbox, .flip, .sc-stage, .sc-strip, .heat")) return (touch.current = null);
    touch.current = { x: t.clientX, y: t.clientY, at: Date.now() };
  };
  const onTouchEnd = (e) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Date.now() - s.at > 600 || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const i = NAV.findIndex(([id]) => id === page);
    const next = NAV[i + (dx < 0 ? 1 : -1)];
    if (next) go(next[0]);
  };

  const Page = PAGES[page];
  return (
    <>
      {/* hash routing: a plain #content link would switch tabs, so this moves focus instead */}
      <a className="skip-link" href="#content" onClick={(e) => (e.preventDefault(), document.getElementById("content")?.focus())}>Skip to content</a>
      <Intro />
      <Boot />
      <Festive />
      <div className="fx-grain" aria-hidden="true" />
      <div className="fx-scan" aria-hidden="true" />
      <main className="shell">
        <Sidebar />
        <div className="main-content" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <Navbar page={page} go={go} />
          <article className="page" key={page} data-page={page} id="content" tabIndex={-1}>
            <Suspense fallback={<Skeleton />}>
              <Page />
            </Suspense>
          </article>
          <footer className="site-foot">
            <span>Last updated {BUILT}</span>
            <button onClick={openShortcuts}>Keyboard shortcuts <kbd>?</kbd></button>
          </footer>
          <div className={`curtain ${phase}`} aria-hidden="true">
            <span className="curtain-noise" />
          </div>
        </div>
      </main>
      <Overlays go={go} />
      <Chat go={go} />
      {osd && (
        <div className="osd" key={osd.key} aria-hidden="true">
          <b>CH {String(osd.n).padStart(2, "0")}</b>
          <span>{osd.label.toUpperCase()}</span>
        </div>
      )}
    </>
  );
}
