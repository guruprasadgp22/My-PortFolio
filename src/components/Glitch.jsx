import { useEffect, useRef, useState } from "react";
import { REDUCED } from "../hooks/motion";

const GLYPHS = "▓▒░█<>/\\[]{}=+*#01";

// Page title that decodes from retro block glyphs with an RGB-split glitch, on mount and on hover.
export default function Glitch({ text }) {
  const [out, setOut] = useState(REDUCED ? text : "");
  const [hot, setHot] = useState(false);
  const raf = useRef(0);

  const run = () => {
    if (REDUCED) return;
    cancelAnimationFrame(raf.current);
    setHot(true);
    let frame = 0;
    const total = text.length * 3 + 14;
    const tick = () => {
      frame++;
      const revealed = Math.floor((frame / total) * text.length);
      setOut([...text].map((c, i) => (i < revealed || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join(""));
      if (frame < total) raf.current = requestAnimationFrame(tick);
      else {
        setOut(text);
        setHot(false);
      }
    };
    tick();
  };

  useEffect(() => {
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
