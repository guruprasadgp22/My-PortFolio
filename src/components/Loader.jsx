import { useLayoutEffect, useState } from "react";
import { REDUCED } from "../hooks/motion";
import { stopScroll, startScroll } from "../hooks/useSmoothScroll";

/*
  Intro screen: counts 0 → 100, then wipes upward to reveal the hero.
  The hero's letter animation waits (paused via the "loading" class) until the wipe starts.
*/
export default function Loader() {
  const [n, setN] = useState(0);
  const [done, setDone] = useState(REDUCED);
  const [gone, setGone] = useState(REDUCED);

  useLayoutEffect(() => {
    if (REDUCED) return;
    const root = document.documentElement;
    root.classList.add("loading");
    stopScroll();
    let start, raf;
    const D = 1400;
    const step = (ts) => {
      start ??= ts;
      const p = Math.min(1, (ts - start) / D);
      setN(Math.round(100 * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
      else {
        setDone(true);
        root.classList.remove("loading");
        startScroll();
        setTimeout(() => setGone(true), 1100);
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("loading");
    };
  }, []);

  if (gone) return null;
  return (
    <div className={`loader ${done ? "done" : ""}`} aria-hidden="true">
      <span className="n">{String(n).padStart(3, "0")}</span>
      <span className="cap">COMPILING PORTFOLIO…</span>
      <span className="bar"><i style={{ transform: `scaleX(${n / 100})` }} /></span>
    </div>
  );
}
