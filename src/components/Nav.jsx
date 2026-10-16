import { useEffect, useRef, useState } from "react";
import { ME, NAV } from "../data";
import { stopScroll, startScroll } from "../hooks/useSmoothScroll";

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  const bar = useRef(null);

  // Top progress bar + solid background after scrolling
  useEffect(() => {
    const on = () => {
      setSolid(scrollY > 40);
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    };
    on();
    addEventListener("scroll", on, { passive: true });
    return () => removeEventListener("scroll", on);
  }, []);

  // Highlight the section currently on screen
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    NAV.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // Lock page scroll while the mobile menu is open; Esc closes it
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    open ? stopScroll() : startScroll();
    const esc = (e) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, [open]);

  return (
    <>
      <div className="progress" ref={bar} style={{ transform: "scaleX(0)" }} />
      <nav className={`nav ${solid ? "solid" : ""}`}>
        <div className="wrap">
          <a href="#top" className="logo">
            {ME.initials}
            <span>.</span>
          </a>
          <div className="links">
            {NAV.map(([id, l]) => (
              <a key={id} href={`#${id}`} className={active === id ? "act" : ""}>
                {l}
              </a>
            ))}
          </div>
          <button
            className={`burger ${open ? "on" : ""}`}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <i />
            <i />
            <i />
          </button>
        </div>
      </nav>
      <div className={`sheet ${open ? "on" : ""}`} aria-hidden={!open}>
        {NAV.map(([id, l], i) => (
          <a
            key={id}
            href={`#${id}`}
            tabIndex={open ? 0 : -1}
            style={{ transitionDelay: open ? `${200 + i * 60}ms` : "0ms" }}
            onClick={() => setOpen(false)}
          >
            <small>0{i + 1}</small>
            {l}
          </a>
        ))}
      </div>
    </>
  );
}
