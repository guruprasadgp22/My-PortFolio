import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NAV } from "../data";
import { SPRING } from "../hooks/spring";
import Icon from "./Icons";

// Phones get five tabs plus "More" (more tabs made the targets too small); tablets show every tab in the bottom bar.
const PRIMARY = ["about", "experience", "projects", "coding", "contact"];
const PHONE = "(max-width: 767px)";
// laptops and desktops: a side rail next to the profile card instead of a row of tabs
const WIDE = "(min-width: 1024px)";

function useMedia(q) {
  const [on, setOn] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const m = matchMedia(q);
    const f = () => setOn(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, [q]);
  return on;
}

function Tab({ id, label, icon, short, active, go }) {
  return (
    <a
      href={`#${id}`}
      className={`navbar-link ${active ? "active" : ""}`}
      aria-current={active ? "page" : undefined}
      data-tip={label}
      aria-label={label}
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

/*
  Page tabs.
    phones and tablets  a tab bar fixed to the bottom of the screen (phones: five tabs plus "More")
    laptops, desktops   a slim rail of icons between the profile card and the page. The menu button at its top
                        opens it into a panel with every page's name (over the page, so nothing reflows);
                        picking a page, Escape or a click outside closes it. Hovering an icon names it.
  A soft pill glides behind the active tab on a spring (shared layoutId), and the tapped icon bounces.
*/
export default function Navbar({ page, go }) {
  const phone = useMedia(PHONE);
  const wide = useMedia(WIDE);
  const [more, setMore] = useState(false);
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const rest = NAV.filter(([id]) => !PRIMARY.includes(id));
  const inMore = rest.find(([id]) => id === page);

  useEffect(() => {
    if (!more && !open) return;
    const close = () => (setMore(false), setOpen(false));
    const out = (e) => !box.current?.contains(e.target) && close();
    const esc = (e) => e.key === "Escape" && (close(), box.current?.querySelector(".rail-toggle")?.focus());
    addEventListener("pointerdown", out);
    addEventListener("keydown", esc);
    return () => (removeEventListener("pointerdown", out), removeEventListener("keydown", esc));
  }, [more, open]);
  useEffect(() => void (!wide && setOpen(false)), [wide]);

  const pick = (id) => (setOpen(false), go(id));
  const tabs = phone ? NAV.filter(([id]) => PRIMARY.includes(id)) : NAV;
  return (
    <div className="rail-slot">
      <nav className={`navbar ${phone ? "five" : ""} ${wide ? "rail" : ""} ${open ? "open" : ""}`} aria-label="Pages" ref={box}>
        <div className="rail-in">
        {wide && (
          <button className="navbar-link rail-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="nav-pages" data-tip="Menu" aria-label={open ? "Close the page menu" : "Open the page menu"}>
            <span className="navbar-ic"><Icon name={open ? "x" : "menu"} size={18} /></span>
            <span className="lbl-full">{open ? "Close" : "Menu"}</span>
          </button>
        )}
        <ul className="navbar-list" id="nav-pages">
          {tabs.map(([id, label, icon, short]) => (
            <li key={id}><Tab id={id} label={label} icon={icon} short={short} active={page === id} go={pick} /></li>
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
        </div>
      </nav>
    </div>
  );
}
