import { useEffect, useRef, useState } from "react";
import { NAV } from "./data";
import { REDUCED } from "./hooks/motion";
import useSmoothScroll, { jumpTop } from "./hooks/useSmoothScroll";
import Boot from "./components/Boot";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import About from "./components/About";
import Experience from "./components/Experience";
import Education from "./components/Education";
import Journey from "./components/Journey";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Coding from "./components/Coding";
import Contact from "./components/Contact";
import Overlays from "./components/Overlays";
import Chat from "./components/Chat";

const PAGES = { about: About, experience: Experience, education: Education, journey: Journey, skills: Skills, projects: Projects, coding: Coding, contact: Contact };
const fromHash = () => {
  const id = location.hash.slice(1);
  return PAGES[id] ? id : NAV[0][0];
};
const COVER = 420; // ms the curtain takes to sweep in before the page swaps

/*
  Layout: profile sidebar + one content card that swaps pages (the active page lives in the URL hash).
  Changing page plays an "old TV channel change": a grainy ember curtain sweeps across, the page swaps
  underneath, the curtain sweeps away, and a channel OSD flashes in the corner.
*/
export default function App() {
  useSmoothScroll();
  const [page, setPage] = useState(fromHash);
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

  useEffect(() => {
    const onHash = () => show(fromHash());
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
    if (e.touches.length > 1 || e.target.closest("input, textarea, .heatgrid, .skill-marquee, .mapbox, .flip")) return (touch.current = null);
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
      <Boot />
      <div className="fx-grain" aria-hidden="true" />
      <div className="fx-scan" aria-hidden="true" />
      <main className="shell">
        <Sidebar />
        <div className="main-content" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <Navbar page={page} go={go} />
          <article className="page" key={page} data-page={page}>
            <Page />
          </article>
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
