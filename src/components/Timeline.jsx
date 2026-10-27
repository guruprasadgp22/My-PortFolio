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
        // read every position first, then write (mixing them forces a layout per stop)
        const r = el.getBoundingClientRect();
        const line = innerHeight * 0.75;
        const items = [...el.querySelectorAll(".timeline-item")];
        const lit = items.map((s) => REDUCED || s.getBoundingClientRect().top < line);
        // only the line itself changes (a variable on the whole list restyled every card on every frame)
        const fill = el.querySelector(".rail i");
        if (fill) fill.style.transform = `scaleY(${REDUCED ? 1 : Math.min(1, Math.max(0, (line - r.top) / r.height))})`;
        items.forEach((s, i) => s.classList.toggle("lit", lit[i]));
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
