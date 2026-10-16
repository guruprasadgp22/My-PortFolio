import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useDragControls } from "framer-motion";
import { SPRING, SOFT, haptic } from "../hooks/spring";
import { startScroll, stopScroll } from "../hooks/useSmoothScroll";
import Icon from "./Icons";

// Layered architecture diagram: each row is a tier, nodes inside a row sit side by side.
function Architecture({ rows }) {
  return (
    <div className="arch" role="img" aria-label={rows.map((r) => r.map(([n]) => n).join(", ")).join(" → ")}>
      {rows.map((row, i) => (
        <motion.div
          className="arch-row"
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SOFT, delay: 0.25 + i * 0.08 }}
        >
          {i > 0 && <span className="arch-arrow" aria-hidden="true" />}
          <div className="arch-nodes">
            {row.map(([name, sub]) => (
              <div className="arch-node" key={name}>
                <b>{name}</b>
                <small>{sub}</small>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/*
  Full-screen project view that grows out of its card (shared layoutId), like an iOS app opening
  from its home-screen icon. Drag the top area down, press Esc, or tap the backdrop to close.
*/
export default function ProjectDetail({ p, onClose }) {
  const drag = useDragControls();
  const closeBtn = useRef(null);
  const cs = p.caseStudy;

  useEffect(() => {
    stopScroll();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });
    const key = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", key);
    return () => {
      removeEventListener("keydown", key);
      document.body.style.overflow = prev;
      startScroll();
    };
  }, [onClose]);

  const fade = (d = 0) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, transition: { duration: 0.12 } }, transition: { ...SOFT, delay: d } });

  return createPortal(
    <div className="pd-root">
      <motion.div className="pd-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.article
        className="pd"
        layoutId={`card-${p.t}`}
        transition={SPRING}
        role="dialog"
        aria-modal="true"
        aria-label={p.t}
        drag="y"
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 700) {
            haptic();
            onClose();
          }
        }}
      >
        <div className="pd-grab" onPointerDown={(e) => drag.start(e)}>
          <span className="pd-handle" aria-hidden="true" />
          <motion.figure className="pd-media" layoutId={`media-${p.t}`} transition={SPRING}>
            {p.img && <img src={p.img} alt={`${p.t} preview`} draggable="false" />}
          </motion.figure>
          <button className="pd-close" ref={closeBtn} onClick={onClose} aria-label="Close project">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="pd-body" data-lenis-prevent>
          <motion.div className="pd-head" {...fade(0.08)}>
            <motion.h3 className="pd-title" layoutId={`title-${p.t}`} transition={SPRING}>{p.t}</motion.h3>
            <p className="pd-meta">{p.cat}{cs?.when ? ` · ${cs.when}` : ""}</p>
          </motion.div>

          <motion.p className="pd-lede" {...fade(0.14)}>{cs?.problem || p.d}</motion.p>

          <motion.div className="stack pd-stack" {...fade(0.18)}>
            {p.stack.map((s) => <span className="tag" key={s}>{s}</span>)}
          </motion.div>

          {cs?.architecture && (
            <motion.section className="pd-sec" {...fade(0.22)}>
              <h4 className="h5">Architecture</h4>
              <Architecture rows={cs.architecture} />
            </motion.section>
          )}

          {cs?.challenges && (
            <motion.section className="pd-sec" {...fade(0.3)}>
              <h4 className="h5">What was hard</h4>
              <ul className="timeline-pts">{cs.challenges.map((c) => <li key={c}>{c}</li>)}</ul>
            </motion.section>
          )}

          {cs?.outcome && (
            <motion.section className="pd-sec" {...fade(0.36)}>
              <h4 className="h5">Where it stands</h4>
              <p className="pd-outcome">{cs.outcome}</p>
            </motion.section>
          )}

          <motion.div className="pd-actions" {...fade(0.4)}>
            <a className="form-btn" href={p.url} target="_blank" rel="noopener noreferrer">
              <Icon name="github" /><span>View code</span>
            </a>
            {p.demo && (
              <a className="form-btn ghost" href={p.demo} target="_blank" rel="noopener noreferrer">
                <Icon name="arrow" /><span>Live demo</span>
              </a>
            )}
          </motion.div>
        </div>
      </motion.article>
    </div>,
    document.body
  );
}
