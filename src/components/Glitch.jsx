import { useEffect, useRef, useState } from "react";
import { REDUCED } from "../hooks/motion";

const GLYPHS = "▓▒░█<>/\\[]{}=+*#01";

const MS = 350; // the whole decode, so the real title is readable almost at once
const played = new Set(); // titles already decoded this visit: later visits to that tab show it straight away

// Page title that decodes from retro block glyphs with an RGB-split glitch: the first time each tab is opened
// (and on hover), in about a third of a second.
export default function Glitch({ text }) {
  const first = !REDUCED && !played.has(text);
  const [out, setOut] = useState(first ? "" : text);
  const [hot, setHot] = useState(false);
  const raf = useRef(0);

  const run = () => {
    if (REDUCED) return;
    cancelAnimationFrame(raf.current);
    setHot(true);
    const start = performance.now();
    const tick = (now) => {
      const k = Math.min(1, ((now ?? performance.now()) - start) / MS);
      const revealed = Math.floor(k * text.length);
      setOut([...text].map((c, i) => (i < revealed || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(""));
      if (k < 1) raf.current = requestAnimationFrame(tick);
      else {
        setOut(text);
        setHot(false);
      }
    };
    tick();
  };

  useEffect(() => {
    if (!first) return;
    played.add(text);
    // on the first visit, wait for the intro curtain to lift so the decode is actually seen
    const wait = document.documentElement.classList.contains("intro") ? 1300 : 0;
    const t = setTimeout(run, wait);
    return () => (clearTimeout(t), cancelAnimationFrame(raf.current));
  }, [text]);

  return (
    <header>
      <h2 className={`article-title glitch ${hot ? "hot" : ""}`} onMouseEnter={run} aria-label={text}>
        <span aria-hidden="true" data-text={out}>{out || " "}</span>
      </h2>
    </header>
  );
}
