import { useEffect, useState } from "react";
import { scrollToTarget } from "../hooks/useSmoothScroll";

const R = 26;
const C = 2 * Math.PI * R;

// Floating button whose ring fills as you scroll down the page.
export default function BackToTop() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setP(max > 0 ? scrollY / max : 0);
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);
  return (
    <button className={`totop ${p > 0.08 ? "on" : ""}`} aria-label="Back to top" onClick={() => scrollToTarget("#top")} data-hover>
      <svg viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
        <circle cx="28" cy="28" r={R} strokeDasharray={C} strokeDashoffset={C * (1 - p)} />
      </svg>
      <span>↑</span>
    </button>
  );
}
