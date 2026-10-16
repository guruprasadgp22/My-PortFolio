import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PROJECTS } from "../data";
import { REDUCED, FINE } from "../hooks/motion";
import Icon from "./Icons";
import Glitch from "./Glitch";
import ProjectDetail from "./ProjectDetail";
import { SPRING } from "../hooks/spring";

// Animated wave artwork used as each project's cover. Only runs while on screen.
function Art({ hue, seed }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    let raf, t = seed * 10, visible = false;
    const size = () => {
      const d = Math.min(devicePixelRatio || 1, 2);
      cv.width = cv.offsetWidth * d;
      cv.height = cv.offsetHeight * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const draw = () => {
      const w = cv.offsetWidth, h = cv.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      for (let l = 0; l < 7; l++) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const y = h / 2 + Math.sin(x * 0.012 + t + l * 0.6) * (18 + l * 6) * Math.sin(t * 0.5 + l) + (l - 3) * 9;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = `hsla(${hue + l * 14}, 95%, ${55 + l * 3}%, ${0.25 + l * 0.1})`;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
      t += 0.012;
      if (!REDUCED && visible) raf = requestAnimationFrame(draw);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      draw();
    });
    size();
    draw();
    io.observe(cv);
    addEventListener("resize", size);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener("resize", size);
    };
  }, [hue, seed]);
  return <canvas ref={ref} aria-hidden="true" />;
}

// Cover that tilts in 3D toward the cursor, with a glare that follows it.
function Tilt({ children }) {
  const ref = useRef(null);
  const move = (e) => {
    if (!FINE || REDUCED) return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.style.transform = `perspective(700px) rotateX(${(0.5 - py) * 14}deg) rotateY(${(px - 0.5) * 16}deg) scale(1.02)`;
  };
  return (
    <figure className="project-img" ref={ref} onMouseMove={move} onMouseLeave={() => (ref.current.style.transform = "")} onPointerDown={() => (ref.current.style.transform = "")}>
      {children}
    </figure>
  );
}

const CATS = ["All", ...new Set(PROJECTS.map((p) => p.cat))];

export default function Projects() {
  const [cat, setCat] = useState("All");
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(null);
  const close = useCallback(() => setSel(null), []);
  const shown = PROJECTS.filter((p) => cat === "All" || p.cat === cat);
  const pick = (c) => {
    setCat(c);
    setOpen(false);
  };

  return (
    <>
      <Glitch text="Projects" />

      <section className="projects">
        <ul className="filter-list">
          {CATS.map((c) => (
            <li key={c}>
              <button className={c === cat ? "active" : ""} onClick={() => pick(c)}>{c}</button>
            </li>
          ))}
        </ul>

        <div className="filter-select-box">
          <button className={`filter-select ${open ? "active" : ""}`} onClick={() => setOpen(!open)} aria-expanded={open}>
            <span>{cat === "All" ? "Select category" : cat}</span>
            <Icon name="chevron" size={16} />
          </button>
          <ul className="select-list">
            {CATS.map((c) => (
              <li key={c}><button className="select-item" onClick={() => pick(c)}>{c}</button></li>
            ))}
          </ul>
        </div>

        <ul className="project-list">
          {shown.map((p, k) => (
            <li className="project-item" key={cat + p.t} style={{ "--i": k }}>
              <motion.div
                className="project-card"
                layoutId={`card-${p.t}`}
                transition={SPRING}
                role="button"
                tabIndex={0}
                aria-label={`Open ${p.t}`}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSel(p)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSel(p))}
              >
                <Tilt>
                  <div className="project-item-icon-box"><Icon name="eye" /></div>
                  <span className="glare" aria-hidden="true" />
                  <motion.span className="project-media" layoutId={`media-${p.t}`} transition={SPRING}>
                    {p.img ? (
                      <img className="project-cover" src={p.img} alt={`${p.t} preview`} loading="lazy" decoding="async" />
                    ) : (
                      <Art hue={p.hue} seed={k} />
                    )}
                  </motion.span>
                </Tilt>
                <motion.h3 className="project-title" layoutId={`title-${p.t}`} transition={SPRING}>{p.t}</motion.h3>
                <p className="project-category">{p.cat}{p.caseStudy && <span className="cs-badge">Case study</span>}</p>
              </motion.div>
              <p className="project-desc">{p.d}</p>
              <div className="stack">{p.stack.map((s) => <span className="tag" key={s}>{s}</span>)}</div>
            </li>
          ))}
        </ul>
      </section>

      <AnimatePresence>{sel && <ProjectDetail key={sel.t} p={sel} onClose={close} />}</AnimatePresence>
    </>
  );
}
