import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ME } from "../data";
import Icon from "./Icons";
import useTheme, { toggleTheme } from "../hooks/theme";
import { SPRING, haptic } from "../hooks/spring";
import { startScroll, stopScroll } from "../hooks/useSmoothScroll";
import Avatar from "./Avatar";
import { openPalette, openQuickView } from "./Overlays";
import { iconFor, handle, softBreaks } from "../socials";

const Wrap = ({ text }) => softBreaks(text).map((x) => (typeof x === "string" ? x : <wbr key={x.wbr} />));

const name = ME.first[0] + ME.first.slice(1).toLowerCase() + ME.last.toLowerCase();
const contacts = [
  { icon: "mail", title: "Email", text: ME.email, href: `mailto:${ME.email}` },
  ...(ME.phone ? [{ icon: "phone", title: "Phone", text: ME.phone, href: `tel:${ME.phone.replace(/\s/g, "")}` }] : []),
  { icon: "pin", title: "Location", text: ME.location },
  ...(ME.website ? [{ icon: "link", title: "Website", text: handle(ME.website), href: ME.website, ext: true }] : []),
  ...ME.socials
    .filter((s) => s.label !== "Resume")
    .map((s) => ({ icon: iconFor(s.label), title: s.label, text: handle(s.url), href: s.url, ext: true })),
];

function ContactBlock() {
  return (
    <>
      <ul className="contacts-list">
        {contacts.map((c) => (
          <li className="contact-item" key={c.title}>
            <div className="icon-box"><Icon name={c.icon} /></div>
            <div className="contact-info">
              <p className="contact-title">{c.title}</p>
              {c.href ? (
                <a className="contact-link" href={c.href} {...(c.ext && { target: "_blank", rel: "noopener noreferrer" })}><Wrap text={c.text} /></a>
              ) : (
                <address>{c.text}</address>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div className="separator" />
      <ul className="social-list">
        {ME.socials.map((s) => (
          <li key={s.label}>
            <a className="social-link" data-net={s.label.toLowerCase()} href={s.url} target="_blank" rel="noopener noreferrer">
              <Icon name={iconFor(s.label)} size={16} />
              <span>{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

// iOS-style bottom sheet for contacts on phones and tablets: follows your finger, snaps closed on a downward flick.
function ContactsSheet({ onClose }) {
  useEffect(() => {
    stopScroll();
    const key = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", key);
    return () => {
      removeEventListener("keydown", key);
      startScroll();
    };
  }, [onClose]);
  return createPortal(
    <div className="sheet-root">
      <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Contact details"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={SPRING}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.05, bottom: 0.8 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100 || info.velocity.y > 500) {
            haptic();
            onClose();
          }
        }}
      >
        <span className="pd-handle sheet-handle" aria-hidden="true" />
        <h3 className="sheet-title">Get in touch</h3>
        <ContactBlock />
      </motion.div>
    </div>,
    document.body
  );
}

// Profile card. On wide screens the contacts sit inside it; on smaller screens they open in a bottom sheet.
export default function Sidebar() {
  const [sheet, setSheet] = useState(false);
  const closeSheet = useCallback(() => setSheet(false), []);
  const theme = useTheme();

  return (
    <aside className="sidebar">
      <div className="sidebar-info">
        <Avatar name={name} />
        <div className="info-content">
          <h1 className="name" title={name}>{name}</h1>
          <p className="title">{ME.roles[0]}</p>
          <button className="qv-btn" onClick={openQuickView}>
            <Icon name="zap" size={14} />
            <span>Recruiter quick view</span>
          </button>
        </div>
        <div className="corner-btns">
          <button className="theme-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title="Toggle theme">
            <span className="theme-ic" key={theme}><Icon name={theme === "dark" ? "sun" : "moon"} size={16} /></span>
          </button>
          <button className="search-btn" onClick={openPalette} aria-label="Open command palette" title="Search (⌘K / Ctrl+K)">
            <Icon name="search" size={16} />
          </button>
          <button className="info-more-btn" onClick={() => setSheet(true)} aria-haspopup="dialog">
            <span>Contacts</span>
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </div>

      <div className="sidebar-info-more">
        <div className="separator" />
        <ContactBlock />
      </div>

      <AnimatePresence>{sheet && <ContactsSheet onClose={closeSheet} />}</AnimatePresence>
    </aside>
  );
}
