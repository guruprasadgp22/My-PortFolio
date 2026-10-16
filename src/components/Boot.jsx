import { useEffect, useLayoutEffect, useState } from "react";
import { ME } from "../data";
import { REDUCED } from "../hooks/motion";
import { startScroll, stopScroll } from "../hooks/useSmoothScroll";

const LINES = [
  `${ME.initials}-BIOS v2.6   (C) ${new Date().getFullYear()} ${ME.first} Systems`,
  "",
  "CPU : Curiosity Core @ 4.20 GHz ........ OK",
  "MEM : 640K conventional ................ OK",
  "DRV : REACT.SYS  NODE.SYS  DSA.SYS ..... OK",
  "",
  "C:\\> RUN PORTFOLIO.EXE",
];

// Once-per-visit retro boot screen. It types BIOS lines, fills a load bar, then the CRT "switches off" to reveal the site.
export default function Boot() {
  const [skip] = useState(() => {
    if (REDUCED) return true;
    try {
      return sessionStorage.getItem("booted") === "1";
    } catch {
      return false;
    }
  });
  const [shown, setShown] = useState(0);
  const [bar, setBar] = useState(0);
  const [done, setDone] = useState(skip);
  const [gone, setGone] = useState(skip);

  useLayoutEffect(() => {
    if (skip) return;
    document.documentElement.classList.add("booting");
    stopScroll();
  }, [skip]);

  useEffect(() => {
    if (skip || done) return;
    const t = [];
    LINES.forEach((_, i) => t.push(setTimeout(() => setShown(i + 1), 120 + i * 170)));
    const barStart = 120 + LINES.length * 170;
    for (let k = 1; k <= 20; k++) t.push(setTimeout(() => setBar(k), barStart + k * 32));
    t.push(setTimeout(() => finish(), barStart + 20 * 32 + 320));
    const key = () => finish();
    addEventListener("keydown", key);
    addEventListener("pointerdown", key);
    return () => {
      t.forEach(clearTimeout);
      removeEventListener("keydown", key);
      removeEventListener("pointerdown", key);
    };
  }, [skip, done]);

  function finish() {
    setDone(true);
    try {
      sessionStorage.setItem("booted", "1");
    } catch {}
    setTimeout(() => {
      document.documentElement.classList.remove("booting");
      startScroll();
    }, 380);
    setTimeout(() => setGone(true), 900);
  }

  if (gone) return null;
  return (
    <div className={`boot ${done ? "off" : ""}`} aria-hidden="true">
      <div className="boot-screen">
        <pre>
          {LINES.slice(0, shown).join("\n")}
          {shown === LINES.length && (
            <>
              {"\n\n"}LOADING [{"█".repeat(bar)}{"░".repeat(20 - bar)}] {bar * 5}%
            </>
          )}
          <span className="caret" />
        </pre>
        <p className="boot-hint">PRESS ANY KEY TO SKIP</p>
      </div>
    </div>
  );
}
