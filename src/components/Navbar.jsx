import { motion } from "framer-motion";
import { NAV } from "../data";
import { SPRING } from "../hooks/spring";
import Icon from "./Icons";

// Page tabs: fixed to the bottom on phones, pinned to the content card's top-right on desktop.
// A soft pill glides behind the active tab on a spring (shared layoutId), and the tapped icon bounces.
export default function Navbar({ page, go }) {
  return (
    <nav className="navbar" aria-label="Pages">
      <ul className="navbar-list">
        {NAV.map(([id, label, icon, short]) => {
          const active = page === id;
          return (
            <li key={id}>
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
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
