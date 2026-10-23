import { useEffect, useRef } from "react";
import { REDUCED } from "../hooks/motion";
import Icon from "./Icons";

// Timeline whose glowing rail fills in as you scroll, lighting each stop as you pass it.
export default function Timeline({ icon, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    let raf;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (innerHeight * 0.75 - r.top) / r.height));
        el.style.setProperty("--p", REDUCED ? 1 : p);
        el.querySelectorAll(".timeline-item").forEach((s) => s.classList.toggle("lit", REDUCED || s.getBoundingClientRect().top < innerHeight * 0.75));
      });
    };
    on();
    // capture: also hears scrolling inside the page card (the scroll area on wide screens)
    addEventListener("scroll", on, { passive: true, capture: true });
    addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", on, { capture: true });
      removeEventListener("resize", on);
    };
  }, []);

  return (
    <section className="timeline">
      <div className="title-wrapper">
        <div className="icon-box"><Icon name={icon} /></div>
        <h3 className="h3">{title}</h3>
      </div>
      <ol className="timeline-list" ref={ref}>
        <li className="rail" aria-hidden="true"><i /></li>
        {children}
      </ol>
    </section>
  );
}
