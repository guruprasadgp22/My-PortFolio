import { useEffect, useRef } from "react";
import { JOURNEY } from "../data";
import { REDUCED } from "../hooks/motion";
import Glitch from "./Glitch";
import Reveal from "./Reveal";
import Icon from "./Icons";
import JourneyMap from "./JourneyMap";
import { openQuickView } from "./Overlays";

// "2018", "Dec 2020", "2021 – 2023", "Now" → the years for the summary line
const years = JOURNEY.map((j) => +(j.yr.match(/\d{4}/)?.[0] || 0)).filter(Boolean);
const span = `${Math.min(...years)} – today`;

/*
  The story as a timeline in chapters. On wide screens the cards alternate left and right of a centre line;
  on phones they sit in one column beside a line on the left. Each stop has its own icon on the line, the
  line fills in as you scroll and every stop lights up as you pass it. Milestones are highlighted, and the
  last card ("Now") ends on what's next.
*/
export default function Journey() {
  const list = useRef(null);

  useEffect(() => {
    let raf;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = list.current;
        if (!el) return;
        // read every position first, then write: mixing them made the browser redo layout once per stop
        const r = el.getBoundingClientRect();
        const line = innerHeight * 0.7;
        const items = [...el.querySelectorAll(".jt-item")];
        const lit = items.map((s) => REDUCED || s.getBoundingClientRect().top < line);
        // only the line itself changes (a variable on the whole list restyled every card on every frame)
        const fill = el.querySelector(".jt-rail i");
        if (fill) fill.style.transform = `scaleY(${REDUCED ? 1 : Math.min(1, Math.max(0, (line - r.top) / r.height))})`;
        // a data attribute, not a class: the reveal animation re-renders the class list and would wipe it
        items.forEach((s, i) => s.hasAttribute("data-lit") !== lit[i] && s.toggleAttribute("data-lit", lit[i]));
      });
    };
    on();
    // capture: also hears the page card scrolling (the scroll area on wide screens)
    addEventListener("scroll", on, { passive: true, capture: true });
    addEventListener("resize", on);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", on, { capture: true });
      removeEventListener("resize", on);
    };
  }, []);

  let side = 0; // alternates left / right; a chapter heading doesn't break the rhythm
  return (
    <>
      <Glitch text="Journey" />
      <p className="jt-lede">From a first <code>printf</code> in a PUC lab to enterprise systems at Sony: {JOURNEY.length} stops, {span}.</p>
      <JourneyMap />

      <ol className="jt" ref={list} aria-label="My journey, oldest first">
        <li className="jt-rail" aria-hidden="true"><i /></li>
        {JOURNEY.map((j, k) => {
          const right = side++ % 2 === 1;
          const now = j.yr === "Now";
          return [
            j.ch && (
              <li className="jt-ch" key={`ch-${j.ch}`} aria-hidden="true">
                <span>{j.ch}</span>
              </li>
            ),
            <Reveal as="li" key={j.yr + j.t} className={`jt-item ${right ? "right" : "left"} ${j.big ? "big" : ""} ${now ? "now" : ""}`} delay={(k % 2) * 60}>
              <span className="jt-node" aria-hidden="true">{j.icon || "•"}</span>
              <article className="jt-card">
                <header>
                  <span className="jt-yr">{j.yr}</span>
                  {j.big && <span className="jt-flag">Milestone</span>}
                  {now && <span className="jt-flag here">You are here</span>}
                </header>
                <h4 className="jt-t">{j.t}</h4>
                <p className="jt-d">{j.d}</p>
                <div className="stack">{j.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
                {now && (
                  <div className="jt-cta">
                    <button className="qv-btn" onClick={openQuickView}><Icon name="zap" size={14} /><span>Recruiter quick view</span></button>
                    <a className="jt-link" href="#contact">Get in touch <Icon name="arrow" size={14} /></a>
                  </div>
                )}
              </article>
            </Reveal>,
          ];
        })}
      </ol>
    </>
  );
}
