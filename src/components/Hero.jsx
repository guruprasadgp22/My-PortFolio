import { useEffect, useRef, useState } from "react";
import { ME } from "../data";
import { REDUCED } from "../hooks/motion";
import ParticleField from "./ParticleField";
import Magnetic from "./Magnetic";

// One line of the giant name, split into letters that flip up one after another.
function Word({ text, base, cls }) {
  return (
    <span className={`row ${cls}`}>
      {[...text].map((c, i) => (
        <span key={i} className="ch" style={{ animationDelay: `${base + i * 55}ms` }}>
          {c}
        </span>
      ))}
    </span>
  );
}

export default function Hero() {
  const [i, setI] = useState(0);
  const content = useRef(null);
  const glows = useRef(null);

  // Rotate the role titles
  useEffect(() => {
    if (REDUCED) return;
    const t = setInterval(() => setI((v) => (v + 1) % ME.roles.length), 2400);
    return () => clearInterval(t);
  }, []);

  // Parallax: hero text drifts up and fades as you scroll; glows follow the mouse
  useEffect(() => {
    if (REDUCED) return;
    const onScroll = () => {
      const y = scrollY;
      if (y > innerHeight * 1.2) return;
      content.current.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
      content.current.style.opacity = Math.max(0, 1 - y / (innerHeight * 0.85));
    };
    const onMove = (e) => {
      const x = (e.clientX / innerWidth - 0.5) * 40;
      const y = (e.clientY / innerHeight - 0.5) * 40;
      glows.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("mousemove", onMove);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <header className="hero" id="top">
      <ParticleField />
      <div className="glows" ref={glows} aria-hidden="true">
        <div className="glow a" />
        <div className="glow b" />
      </div>
      <div className="wrap" ref={content}>
        <span className="status">
          <b />
          Open to SDE roles · {ME.location}
        </span>
        <h1 className="name" aria-label={`${ME.first} ${ME.last}`}>
          <Word text={ME.first} base={150} cls="one" />
          <Word text={ME.last} base={420} cls="two" />
        </h1>
        <div className="role">
          I'm a
          <span className="swap" aria-live="polite">
            {ME.roles.map((r, k) => (
              <span key={r} style={{ transform: `translateY(${(k - i) * 110}%)`, opacity: k === i ? 1 : 0 }} aria-hidden={k !== i}>
                {r}
              </span>
            ))}
          </span>
        </div>
        <p className="lede">{ME.lede}</p>
        <div className="ctas">
          <Magnetic className="btn hot" href="#projects">See my work →</Magnetic>
          <Magnetic className="btn" href="#about">About me</Magnetic>
        </div>
      </div>
      <div className="scrollcue" aria-hidden="true">
        SCROLL
        <i />
      </div>
    </header>
  );
}
