import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { NAV } from "./data";
import { REDUCED } from "./hooks/motion";
import useSmoothScroll, { jumpTop } from "./hooks/useSmoothScroll";
import { ScrollRoot, useDesktop } from "./hooks/scrollRoot";
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
/*
  Layout: profile sidebar + one content card that swaps pages (the active page lives in the URL hash).
  Changing page is a quick fade (about a quarter of a second), so clicking through every tab never feels heavy.
*/
export default function App() {
  // wide screens: the window stays still; the profile and the page card each scroll on their own
  const desktop = useDesktop();
  useSmoothScroll(!desktop);
  const [scroller, setScroller] = useState(null); // the page card, which is the scroll area on wide screens
  const root = useMemo(() => ({ current: desktop ? scroller : null }), [desktop, scroller]);
  const [page, setPage] = useState(fromHash);
  const pageRef = useRef(page);
  pageRef.current = page;
  // the new page fades in (CSS on .page); with reduced motion it simply appears
  const show = (id) => {
    setPage(id);
    jumpTop();
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
    return () => removeEventListener("hashchange", onHash);
  }, []);

  const go = (id) => {
    if (id === page) return;
    history.pushState(null, "", `#${id}`);
    show(id);
  };

  // Phones: swipe left / right on the content to move between tabs, like OxygenOS.
  const touch = useRef(null);
  const onTouchStart = (e) => {
    const t = e.touches[0];
    // ignore gestures that start on things that scroll sideways or take input
    if (e.touches.length > 1 || e.target.closest("input, textarea, .heatgrid, .skill-marquee, .mapbox, .flip, .sc-stage, .sc-strip, .sc-picks, .heat")) return (touch.current = null);
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
      {/* colour pools behind the liquid-glass surfaces */}
      <div className="ambient" aria-hidden="true"><i /><i /><i /></div>
      <div className="fx-grain" aria-hidden="true" />
      <div className="fx-scan" aria-hidden="true" />
      <main className="shell">
        <Sidebar />
        <div className="main-content" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <Navbar page={page} go={go} />
          <article className="page" key={page} data-page={page} id="content" tabIndex={-1} ref={setScroller}>
            <ScrollRoot.Provider value={root}>
              <Suspense fallback={<Skeleton />}>
                <Page />
              </Suspense>
            </ScrollRoot.Provider>
          </article>
          <footer className="site-foot">
            <span>Last updated {BUILT}</span>
            <button onClick={openShortcuts}>Keyboard shortcuts <kbd>?</kbd></button>
          </footer>
        </div>
      </main>
      <Overlays go={go} />
      <Chat go={go} />
    </>
  );
}
