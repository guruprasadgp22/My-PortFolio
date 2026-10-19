import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { EDUCATION, EXPERIENCE, ME, NAV } from "../data";
import { livePlatforms } from "./Coding";
import { SPRING } from "../hooks/spring";
import { startScroll, stopScroll } from "../hooks/useSmoothScroll";
import { toggleTheme } from "../hooks/theme";
import useStats from "../hooks/useStats";
import Icon from "./Icons";
import { replayBoot } from "./Boot";
import { openChat } from "./Chat";

const resume = ME.socials.find((s) => s.label === "Resume")?.url;
const social = (label) => ME.socials.find((s) => s.label === label)?.url;
// Actions that re-render the whole page (changing tab or theme) would interrupt the overlay's exit animation
// and leave its backdrop stuck on screen, so close first and run them once it's gone.
const AFTER_EXIT = 220;

// Pages and other parts of the site can open these with: dispatchEvent(new Event("open-palette" | "open-quickview"))
export const openPalette = () => dispatchEvent(new Event("open-palette"));
export const openQuickView = () => dispatchEvent(new Event("open-quickview"));

function useLock(on) {
  useEffect(() => {
    if (!on) return;
    stopScroll();
    return () => startScroll();
  }, [on]);
}

function Modal({ onClose, className, label, children }) {
  useEffect(() => {
    const key = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [onClose]);
  return createPortal(
    <div className="ov-root">
      <motion.div className="ov-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className={`ov ${className}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10, transition: { duration: 0.15 } }}
        transition={SPRING}
      >
        {children}
      </motion.div>
    </div>,
    document.body
  );
}

// ⌘/Ctrl + K: jump to any page or run a quick action.
function Palette({ go, onClose }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef(null);
  const [copied, setCopied] = useState(false);

  const items = useMemo(
    () => [
      ...NAV.map(([id, label, icon]) => ({ k: `Go to ${label}`, icon, run: () => go(id) })),
      { k: "Recruiter quick view", icon: "zap", run: openQuickView, keep: true }, // swaps the palette for the quick view
      { k: "Ask GP Assistant (AI chat, job matcher)", icon: "sparkle", run: openChat },
      { k: "Copy email address", icon: "copy", run: () => navigator.clipboard?.writeText(ME.email).then(() => setCopied(true)), keep: true },
      resume && { k: "Download resume", icon: "download", run: () => open(resume, "_blank") },
      { k: "Toggle light / dark theme", icon: "sun", run: () => toggleTheme() },
      social("GitHub") && { k: "Open GitHub", icon: "github", run: () => open(social("GitHub"), "_blank") },
      social("LinkedIn") && { k: "Open LinkedIn", icon: "linkedin", run: () => open(social("LinkedIn"), "_blank") },
      { k: "Send an email", icon: "mail", run: () => (location.href = `mailto:${ME.email}`) },
      { k: "Replay boot screen", icon: "zap", run: replayBoot },
    ].filter(Boolean),
    [go]
  );
  const shown = items.filter((it) => it.k.toLowerCase().includes(q.trim().toLowerCase()));

  useEffect(() => input.current?.focus(), []);
  useEffect(() => setI(0), [q]);

  const run = (it) => {
    if (!it) return;
    if (it.keep) return it.run();
    onClose();
    setTimeout(it.run, AFTER_EXIT);
  };
  const key = (e) => {
    if (e.key === "ArrowDown") (e.preventDefault(), setI((n) => Math.min(n + 1, shown.length - 1)));
    if (e.key === "ArrowUp") (e.preventDefault(), setI((n) => Math.max(n - 1, 0)));
    if (e.key === "Enter") (e.preventDefault(), run(shown[i]));
  };

  return (
    <Modal onClose={onClose} className="palette" label="Command palette">
      <div className="pal-search">
        <Icon name="search" />
        <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={key} placeholder="Type a command or page…" aria-label="Search commands" role="combobox" aria-expanded="true" aria-controls="pal-list" />
        <kbd>esc</kbd>
      </div>
      <ul className="pal-list" id="pal-list" role="listbox" data-lenis-prevent>
        {shown.map((it, n) => (
          <li key={it.k} role="option" aria-selected={n === i}>
            <button className={n === i ? "on" : ""} onMouseMove={() => setI(n)} onClick={() => run(it)}>
              <Icon name={it.icon} />
              <span>{it.k === "Copy email address" && copied ? "Email copied ✓" : it.k}</span>
            </button>
          </li>
        ))}
        {!shown.length && <li className="pal-empty">No matches for “{q}”</li>}
      </ul>
      <p className="pal-foot"><kbd>↑</kbd><kbd>↓</kbd> to move · <kbd>↵</kbd> to run</p>
    </Modal>
  );
}

// One-screen summary for busy recruiters.
function QuickView({ go, onClose }) {
  const stats = useStats();
  // same total as the Coding page: every platform, live where possible
  const solved = livePlatforms(stats).reduce((n, p) => n + p.val, 0);
  const degree = EDUCATION[0];
  return (
    <Modal onClose={onClose} className="quick" label="Recruiter quick view">
      <div className="qv-head">
        <img src="/me.jpg" alt="" className="qv-photo" />
        <div>
          <h3 className="qv-name">Guruprasad</h3>
          <p className="qv-status"><i />{ME.availability} · {ME.location}</p>
        </div>
        <button className="pd-close qv-close" onClick={onClose} aria-label="Close quick view"><Icon name="x" size={18} /></button>
      </div>
      <div className="qv-body" data-lenis-prevent>
        <section>
          <h4 className="h5">Looking for</h4>
          <div className="stack">{ME.lookingFor.map((r) => <span className="tag qv-role" key={r}>{r}</span>)}</div>
        </section>
        <section>
          <h4 className="h5">Top skills</h4>
          <div className="chips">{ME.topSkills.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
        </section>
        <section>
          <h4 className="h5">Experience</h4>
          <ul className="qv-list">
            {EXPERIENCE.map((x) => (
              <li key={x.role + x.when}><b>{x.role}</b><span>{x.org.split(" · ")[0]}</span><small>{x.when}</small></li>
            ))}
          </ul>
        </section>
        <section className="qv-grid">
          <div><small>Education</small><b>B.E. CSE · {degree.score}</b></div>
          <div><small>Problems solved</small><b>{solved.toLocaleString("en-IN")}+</b></div>
        </section>
      </div>
      <div className="qv-actions">
        {resume && <a className="form-btn" href={resume} target="_blank" rel="noopener noreferrer"><Icon name="download" /><span>Resume</span></a>}
        <a className="form-btn ghost" href={`mailto:${ME.email}`}><Icon name="mail" /><span>Email</span></a>
        {ME.phone && <a className="form-btn ghost" href={`tel:${ME.phone.replace(/\s/g, "")}`}><Icon name="phone" /><span>Call</span></a>}
        <button className="form-btn ghost" onClick={() => (onClose(), setTimeout(() => go("experience"), AFTER_EXIT))}><Icon name="briefcase" /><span>Full profile</span></button>
      </div>
    </Modal>
  );
}

export default function Overlays({ go }) {
  const [which, setWhich] = useState(null); // "palette" | "quick" | null
  useLock(!!which);

  useEffect(() => {
    const key = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setWhich((w) => (w === "palette" ? null : "palette"));
      }
    };
    const pal = () => setWhich("palette");
    const qv = () => setWhich("quick");
    addEventListener("keydown", key);
    addEventListener("open-palette", pal);
    addEventListener("open-quickview", qv);
    return () => {
      removeEventListener("keydown", key);
      removeEventListener("open-palette", pal);
      removeEventListener("open-quickview", qv);
    };
  }, []);

  const close = () => setWhich(null);
  return (
    <AnimatePresence>
      {which === "palette" && <Palette key="p" go={go} onClose={close} />}
      {which === "quick" && <QuickView key="q" go={go} onClose={close} />}
    </AnimatePresence>
  );
}
