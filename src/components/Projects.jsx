import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ME } from "../data";
import { projectsFor } from "../hooks/visitor";
import { REDUCED, revealInRow } from "../hooks/motion";
import { SPRING, haptic } from "../hooks/spring";
import Icon from "./Icons";
import Glitch from "./Glitch";
import ProjectDetail from "./ProjectDetail";
import LiveNote from "./LiveNote";
import CopyButton from "./CopyButton";
import pic from "../hooks/img";

// The showcase has the main projects; smaller internship and course projects are listed under it.
// ?role=ai or ?role=python in the link puts the AI project first.
const PROJECTS = projectsFor().filter((p) => !p.training);
const TRAINING = projectsFor().filter((p) => p.training);
const N = PROJECTS.length;

// Shareable addresses: #projects/job-board opens the showcase on that project.
export const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fromHash = () => location.hash.slice(1).split("/")[1] || "";
const linkTo = (p) => `${location.origin}${location.pathname}${location.search}#projects/${slug(p.t)}`;

// Free hosts sleep when idle. Start waking them as soon as Projects opens, so the Live button is quick by the time
// someone clicks it. no-cors: we only need the request to arrive, not to read the answer.
let woken = false;
const wakeDemos = () => {
  if (woken) return;
  woken = true;
  PROJECTS.forEach((p) => p.wake && fetch(p.wake, { mode: "no-cors", cache: "no-store" }).catch(() => {}));
};

// Smaller projects from internships and courses: one compact card each, with whatever links exist.
function Training() {
  if (!TRAINING.length) return null;
  return (
    <section className="tp">
      <h3 className="h3">Training projects</h3>
      <p className="tp-sub">Smaller apps from my internships and courses.</p>
      <ul className="tp-list">
        {TRAINING.map((p) => (
          <li className="tp-card" id={`p-${slug(p.t)}`} key={p.t} style={{ "--h": p.hue }}>
            <div className="tp-top">
              <b>{p.t}</b>
              {p.from && <small>{p.from}</small>}
            </div>
            <p>{p.d}</p>
            <div className="tp-ft">
              <span className="tp-stack">{p.stack.slice(0, 4).join(" · ")}</span>
              <span className="tp-links">
                {p.demo && <a href={p.demo} target="_blank" rel="noopener noreferrer"><Icon name="arrow" size={14} />Live</a>}
                {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer"><Icon name="github" size={14} />Code</a>}
                {!p.url && !p.demo && <span className="tp-none">code on request</span>}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
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
            <motion.img key={p.t} {...pic(p.img, "(min-width: 1250px) 620px, (min-width: 768px) 70vw, 90vw")} alt={`${p.t} on a tablet`} custom={dir} variants={TABLET} initial="enter" animate="show" exit="exit" draggable="false" />
          </AnimatePresence>
        </span>
        <span className="sc-cam" aria-hidden="true" />
      </motion.button>
      {/* phone: null in data.js hides the phone (no mobile screenshot yet) */}
      {p.phone !== null && (
        <span className="sc-phone">
          <span className="sc-screen">
            <AnimatePresence initial={false} custom={dir} mode="popLayout">
              <motion.img key={p.t} {...pic(p.phone || p.img, "220px")} className={p.phone ? "real" : undefined} alt={`${p.t} on a phone`} custom={dir} variants={PHONE} initial="enter" animate="show" exit="exit" draggable="false" />
            </AnimatePresence>
          </span>
          <span className="sc-notch" />
        </span>
      )}
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
  const [[i, dir], setI] = useState(() => [Math.max(0, PROJECTS.findIndex((p) => slug(p.t) === fromHash())), 1]);
  const [sel, setSel] = useState(null);
  const close = useCallback(() => setSel(null), []);
  const strip = useRef(null);
  const p = PROJECTS[i];
  const iRef = useRef(i);
  const moved = useRef(false);
  iRef.current = i;

  const go = useCallback((to, d) => {
    haptic(5);
    setI(([cur]) => {
      const next = (to + N) % N;
      return [next, d ?? (next > cur ? 1 : -1)];
    });
  }, []);
  const prev = () => go(i - 1, -1);
  const next = () => go(i + 1, 1);

  // keep the active thumbnail in view when the strip scrolls sideways, and the address in step with the project
  useEffect(() => {
    revealInRow(strip.current, strip.current?.querySelector(`[data-i="${i}"]`));
    // skip the first run, so an incoming link to a training project keeps its address until it's been followed
    if (moved.current && location.hash.startsWith("#projects")) history.replaceState(null, "", `#projects/${slug(PROJECTS[i].t)}`);
    moved.current = true;
  }, [i]);

  // following a project link while already on this tab: jump to it (a training project scrolls to its card)
  useEffect(() => {
    const follow = () => {
      const k = PROJECTS.findIndex((x) => slug(x.t) === fromHash());
      if (k > -1) return setI(([cur]) => (k === cur ? [cur, 1] : [k, k > cur ? 1 : -1]));
      const card = fromHash() && document.getElementById(`p-${fromHash()}`);
      if (!card) return;
      document.querySelectorAll(".tp-card.hl").forEach((c) => c.classList.remove("hl"));
      card.classList.add("hl");
      setTimeout(() => card.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" }), 400);
    };
    follow();
    addEventListener("hashchange", follow);
    return () => removeEventListener("hashchange", follow);
  }, []);

  // ← / → move between projects anywhere on this page (not while typing or with a window open)
  useEffect(() => {
    const key = (e) => {
      if (e.target.closest?.("input, textarea, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('[aria-modal="true"]')) return;
      if (e.key === "ArrowRight") (e.preventDefault(), go(iRef.current + 1, 1));
      if (e.key === "ArrowLeft") (e.preventDefault(), go(iRef.current - 1, -1));
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [go]);

  // warm the cache so switching projects never waits on an image, and wake any sleeping demo servers
  useEffect(() => {
    wakeDemos();
    PROJECTS.forEach((x) => [x.img, x.phone].filter(Boolean).forEach((src) => {
      const im = new Image();
      Object.assign(im, { sizes: "(min-width: 1250px) 620px, 90vw", srcset: pic(src).srcSet || "" });
      im.src = src;
    }));
  }, []);

  return (
    <>
      <Glitch text="Projects" />

      <section className="showcase" aria-roledescription="carousel" aria-label="Projects">
        {/* every main project up front as a card (image + name), so none hides behind the arrows;
            on phones they swipe sideways with the next card peeking in */}
        <div className="sc-picks" ref={strip} role="tablist" aria-label="Choose a project">
          {PROJECTS.map((x, k) => (
            <button key={x.t} data-i={k} role="tab" aria-selected={k === i} className={`sc-pick ${k === i ? "on" : ""}`} onClick={() => go(k)}>
              {k === i && <motion.span className="sc-ring" layoutId="sc-ring" transition={SPRING} />}
              <span className="sc-pick-img"><img {...pic(x.img, "(min-width: 768px) 300px, 70vw")} alt="" loading="lazy" draggable="false" /></span>
              <span className="sc-pick-t">{x.t}</span>
              <small>{x.cat}{x.demo ? " · live demo" : ""}</small>
            </button>
          ))}
        </div>

        <Stage p={p} dir={dir} onPrev={prev} onNext={next} onOpen={() => setSel(p)} />

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
                {p.apiDocs && <a className="sc-btn" href={p.apiDocs} target="_blank" rel="noopener noreferrer"><Icon name="code" size={16} />API docs</a>}
                {p.video && <a className="sc-btn" href={p.video} target="_blank" rel="noopener noreferrer"><Icon name="eye" size={16} />60-s demo</a>}
                <CopyButton className="sc-btn" text={() => linkTo(p)} label="Copy link" done="Link copied" iconSize={16} />
              </div>
              <LiveNote p={p} />
              <p className="sc-desc">{p.d}</p>
              <div className="stack">{p.stack.map((s) => <span className="tag" key={s}>{s}</span>)}</div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

      <Training />

      <AnimatePresence>{sel && <ProjectDetail key={sel.t} p={sel} onClose={close} />}</AnimatePresence>
    </>
  );
}
