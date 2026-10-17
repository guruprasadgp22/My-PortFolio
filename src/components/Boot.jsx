import { useEffect, useState } from "react";
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

// Retro boot screen, played on demand (command palette → "Replay boot screen") so it never delays the first visit.
// It types BIOS lines, fills a load bar, then the CRT "switches off" to reveal the site.
export const replayBoot = () => dispatchEvent(new Event("replay-boot"));

export default function Boot() {
  const [run, setRun] = useState(0); // bumps each replay, restarting the sequence
  const [shown, setShown] = useState(0);
  const [bar, setBar] = useState(0);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(true);

  useEffect(() => {
    const start = () => {
      if (REDUCED) return;
      setShown(0);
      setBar(0);
      setDone(false);
      setGone(false);
      setRun((n) => n + 1);
    };
    addEventListener("replay-boot", start);
    return () => removeEventListener("replay-boot", start);
  }, []);

  useEffect(() => {
    if (!run || done) return;
    stopScroll();
    const t = [];
    LINES.forEach((_, i) => t.push(setTimeout(() => setShown(i + 1), 120 + i * 170)));
    const barStart = 120 + LINES.length * 170;
    for (let k = 1; k <= 20; k++) t.push(setTimeout(() => setBar(k), barStart + k * 32));
    t.push(setTimeout(() => finish(), barStart + 20 * 32 + 320));
    const key = () => finish();
    // wait a tick so the click that started the replay doesn't skip it straight away
    t.push(setTimeout(() => (addEventListener("keydown", key), addEventListener("pointerdown", key)), 50));
    return () => {
      t.forEach(clearTimeout);
      removeEventListener("keydown", key);
      removeEventListener("pointerdown", key);
    };
  }, [run, done]);

  function finish() {
    setDone(true);
    setTimeout(startScroll, 380);
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
