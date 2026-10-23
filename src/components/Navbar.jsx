import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NAV } from "../data";
import { SPRING } from "../hooks/spring";
import Icon from "./Icons";

// Phones get five tabs plus "More" (8 tabs made the targets too small); wider screens show all eight.
const PRIMARY = ["about", "experience", "projects", "coding", "contact"];
const PHONE = "(max-width: 767px)";

function usePhone() {
  const [on, setOn] = useState(() => matchMedia(PHONE).matches);
  useEffect(() => {
    const m = matchMedia(PHONE);
    const f = () => setOn(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return on;
}

function Tab({ id, label, icon, short, active, go }) {
  return (
    <a
      href={`#${id}`}
      className={`navbar-link ${active ? "active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={(e) => {
        e.preventDefault();
        go(id);
      }}
    >
      {active && <motion.span layoutId="nav-pill" className="navbar-pill" transition={SPRING} aria-hidden="true" />}
      <motion.span className="navbar-ic" animate={active ? { y: -2, scale: 1.12 } : { y: 0, scale: 1 }} whileTap={{ scale: 0.8 }} transition={SPRING}>
        <Icon name={icon} size={18} />
      </motion.span>
      <span className="lbl-full">{label}</span>
      <span className="lbl-short">{short || label}</span>
    </a>
  );
}

// Page tabs: fixed to the bottom on phones and tablets, pinned to the content card's top-right on desktop.
// A soft pill glides behind the active tab on a spring (shared layoutId), and the tapped icon bounces.
export default function Navbar({ page, go }) {
  const phone = usePhone();
  const [more, setMore] = useState(false);
  const box = useRef(null);
  const rest = NAV.filter(([id]) => !PRIMARY.includes(id));
  const inMore = rest.find(([id]) => id === page);

  useEffect(() => {
    if (!more) return;
    const out = (e) => !box.current?.contains(e.target) && setMore(false);
    const esc = (e) => e.key === "Escape" && setMore(false);
    addEventListener("pointerdown", out);
    addEventListener("keydown", esc);
    return () => (removeEventListener("pointerdown", out), removeEventListener("keydown", esc));
  }, [more]);

  const tabs = phone ? NAV.filter(([id]) => PRIMARY.includes(id)) : NAV;
  return (
    <nav className={`navbar ${phone ? "five" : ""}`} aria-label="Pages" ref={box}>
      <ul className="navbar-list">
        {tabs.map(([id, label, icon, short]) => (
          <li key={id}><Tab id={id} label={label} icon={icon} short={short} active={page === id} go={go} /></li>
        ))}
        {phone && (
          <li className="nav-more-li">
            {/* "More" shows the page it holds when one of them is open */}
            <button className={`navbar-link ${inMore ? "active" : ""}`} onClick={() => setMore(!more)} aria-expanded={more} aria-haspopup="menu">
              {inMore && <motion.span layoutId="nav-pill" className="navbar-pill" transition={SPRING} aria-hidden="true" />}
              <span className="navbar-ic"><Icon name={inMore ? inMore[2] : "layers"} size={18} /></span>
              <span className="lbl-short">{inMore ? inMore[3] || inMore[1] : "More"}</span>
            </button>
            <AnimatePresence>
              {more && (
                <motion.ul className="nav-more" role="menu" initial={{ opacity: 0, y: 10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={SPRING}>
                  {rest.map(([id, label, icon]) => (
                    <li key={id} role="none">
                      <button role="menuitem" className={page === id ? "on" : ""} onClick={() => (setMore(false), go(id))}>
                        <Icon name={icon} size={18} />
                        <span>{label}</span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </li>
        )}
      </ul>
    </nav>
  );
}
