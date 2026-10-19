import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ME, PROJECTS } from "../data";
import { REDUCED, revealInRow } from "../hooks/motion";
import { SPRING, haptic } from "../hooks/spring";
import Icon from "./Icons";
import Glitch from "./Glitch";
import ProjectDetail from "./ProjectDetail";

const N = PROJECTS.length;
const pad = (n) => String(n).padStart(2, "0");

// Screens slide in from the side you're heading to; the phone trails a little behind for depth.
const slide = (lag = 0) => ({
  enter: (dir) => (REDUCED ? { opacity: 0 } : { opacity: 0, x: `${dir * (14 + lag * 10)}%`, scale: 0.96 }),
  show: { opacity: 1, x: 0, scale: 1, transition: { ...SPRING, delay: REDUCED ? 0 : lag * 0.06 } },
  exit: (dir) => (REDUCED ? { opacity: 0 } : { opacity: 0, x: `${dir * -(10 + lag * 8)}%`, scale: 0.97, transition: { duration: 0.22 } }),
});
const TABLET = slide(0), PHONE = slide(1);

// Big device mockup: a tablet with a phone leaning on it, both showing the selected project.
function Stage({ p, dir, onPrev, onNext, onOpen }) {
  const touch = useRef(null);
  const onTouchStart = (e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY });
  const onTouchEnd = (e) => {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x, dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) (dx < 0 ? onNext : onPrev)();
  };
  return (
    <div className="sc-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <motion.button className="sc-tablet" layoutId={`card-${p.t}`} transition={SPRING} onClick={onOpen} aria-label={`Open ${p.t} ${p.caseStudy ? "case study" : "details"}`}>
        <span className="sc-screen">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.img key={p.t} src={p.img} alt={`${p.t} on a tablet`} custom={dir} variants={TABLET} initial="enter" animate="show" exit="exit" draggable="false" />
          </AnimatePresence>
        </span>
        <span className="sc-cam" aria-hidden="true" />
      </motion.button>
      <span className="sc-phone" aria-hidden="true">
        <span className="sc-screen">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.img key={p.t} src={p.phone || p.img} alt="" custom={dir} variants={PHONE} initial="enter" animate="show" exit="exit" draggable="false" />
          </AnimatePresence>
        </span>
        <span className="sc-notch" />
      </span>
      <button className="sc-arrow prev" onClick={onPrev} aria-label="Previous project"><Icon name="next" size={20} /></button>
      <button className="sc-arrow next" onClick={onNext} aria-label="Next project"><Icon name="next" size={20} /></button>
    </div>
  );
}

/*
  Projects as a showcase: a device mockup of the selected project, a numbered thumbnail strip to jump
  between them (number pills on phones), then the title, highlight numbers, links and description.
  Arrow keys, the arrow buttons and swiping on the mockup all move between projects.
*/
export default function Projects() {
  const [[i, dir], setI] = useState([0, 1]);
  const [sel, setSel] = useState(null);
  const close = useCallback(() => setSel(null), []);
  const strip = useRef(null);
  const p = PROJECTS[i];

  const go = useCallback((to, d) => {
    haptic(5);
    setI(([cur]) => {
      const next = (to + N) % N;
      return [next, d ?? (next > cur ? 1 : -1)];
    });
  }, []);
  const prev = () => go(i - 1, -1);
  const next = () => go(i + 1, 1);

  // keep the active thumbnail in view when the strip scrolls sideways
  useEffect(() => {
    revealInRow(strip.current, strip.current?.querySelector(`[data-i="${i}"]`));
  }, [i]);

  // warm the cache so switching projects never waits on an image
  useEffect(() => {
    PROJECTS.forEach((x) => [x.img, x.phone].filter(Boolean).forEach((src) => (new Image().src = src)));
  }, []);

  const onKey = (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.key === "ArrowRight") (e.preventDefault(), next());
    if (e.key === "ArrowLeft") (e.preventDefault(), prev());
  };

  return (
    <>
      <Glitch text="Projects" />

      <section className="showcase" onKeyDown={onKey} aria-roledescription="carousel" aria-label="Projects">
        <Stage p={p} dir={dir} onPrev={prev} onNext={next} onOpen={() => setSel(p)} />

        <div className="sc-strip" ref={strip} role="tablist" aria-label="Choose a project">
          {PROJECTS.map((x, k) => (
            <button key={x.t} data-i={k} role="tab" aria-selected={k === i} aria-label={`${k + 1}. ${x.t}`} className={`sc-thumb ${k === i ? "on" : ""}`} onClick={() => go(k)}>
              {k === i && <motion.span className="sc-ring" layoutId="sc-ring" transition={SPRING} />}
              <img src={x.img} alt="" loading="lazy" draggable="false" />
              <b>{k + 1}</b>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={p.t}
            className="sc-info"
            initial={REDUCED ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={REDUCED ? { opacity: 0 } : { opacity: 0, y: -8, transition: { duration: 0.14 } }}
            transition={SPRING}
            aria-live="polite"
          >
            <div className="sc-left">
              <div className="sc-titlebar">
                <p className="sc-count">{pad(i + 1)} / {pad(N)} · {p.cat}{p.caseStudy?.when ? ` · ${p.caseStudy.when}` : ""}</p>
                <div className="sc-mini" aria-hidden="true">
                  <button onClick={prev} tabIndex={-1}><Icon name="next" size={18} /></button>
                  <button onClick={next} tabIndex={-1}><Icon name="next" size={18} /></button>
                </div>
              </div>
              <h3 className="sc-title">{p.t}</h3>
              {p.stats?.length > 0 && (
                <dl className="sc-stats">
                  {p.stats.map(([n, l]) => (
                    <div key={l}><dt className="sr-only">{l}</dt><dd><b>{n}</b> {l}</dd></div>
                  ))}
                </dl>
              )}
            </div>
            <div className="sc-right">
              <div className="sc-btns">
                {p.demo && <a className="sc-btn live" href={p.demo} target="_blank" rel="noopener noreferrer"><Icon name="arrow" size={16} />Live</a>}
                {p.url ? (
                  <a className="sc-btn" href={p.url} target="_blank" rel="noopener noreferrer"><Icon name="github" size={16} />Code</a>
                ) : (
                  <a className="sc-btn" href={`mailto:${ME.email}?subject=${encodeURIComponent(`Walkthrough: ${p.t}`)}`} title="The code isn't public yet"><Icon name="mail" size={16} />Ask for a walkthrough</a>
                )}
                <button className={`sc-btn ${p.demo ? "" : "live"}`} onClick={() => setSel(p)}><Icon name="eye" size={16} />{p.caseStudy ? "Case study" : "Details"}</button>
              </div>
              <p className="sc-desc">{p.d}</p>
              <div className="stack">{p.stack.map((s) => <span className="tag" key={s}>{s}</span>)}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      <AnimatePresence>{sel && <ProjectDetail key={sel.t} p={sel} onClose={close} />}</AnimatePresence>
    </>
  );
}
