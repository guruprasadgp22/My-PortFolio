import { useEffect, useState } from "react";
import { ME } from "../data";

/*
  First-visit intro, about a second long: the GP monogram rises out of a mask, an ember line sweeps under it,
  then the curtain lifts and the page assembles itself piece by piece (the "intro" styles in global.css).
  index.html adds html.intro before the first paint on every page load (never with reduced motion).
  Any key or tap skips it.
*/
const root = document.documentElement;
export const INTRO = root.classList.contains("intro");
const LIFT = 1150; // ms until the curtain starts lifting
const SETTLE = 1500; // ms after the lift until every entrance animation has finished

export default function Intro() {
  const [phase, setPhase] = useState(INTRO ? "show" : "gone"); // show → lift → gone

  useEffect(() => {
    if (!INTRO) return;
    // "intro-go" starts the page's entrance (its delays in global.css count from this moment)
    const lift = () => (setPhase("lift"), root.classList.add("intro-go"));
    const done = () => root.classList.remove("intro", "intro-go", "intro-fast");
    const t = [setTimeout(lift, LIFT), setTimeout(() => setPhase("gone"), LIFT + 950), setTimeout(done, LIFT + SETTLE)];
    const skip = () => {
      t.forEach(clearTimeout);
      root.classList.add("intro-fast");
      lift();
      t.push(setTimeout(() => setPhase("gone"), 500), setTimeout(done, 1200));
    };
    addEventListener("keydown", skip, { once: true });
    addEventListener("pointerdown", skip, { once: true });
    return () => {
      t.forEach(clearTimeout);
      removeEventListener("keydown", skip);
      removeEventListener("pointerdown", skip);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={`intro-veil ${phase}`} aria-hidden="true">
      <div className="intro-mark">
        {[...ME.initials].map((c, i) => (
          <span className="im-mask" key={i}><span className="im-l" style={{ "--i": i }}>{c}</span></span>
        ))}
      </div>
      <i className="intro-line" />
      <p className="intro-cap">{ME.first[0] + ME.first.slice(1).toLowerCase() + ME.last.toLowerCase()} · {ME.roles[1]}</p>
    </div>
  );
}
