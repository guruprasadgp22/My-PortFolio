import { useEffect, useRef } from "react";
import { ABOUT } from "../data";
import { REDUCED } from "../hooks/motion";

/*
  Tech logos orbiting the profile photo on two rings that turn in opposite directions.
  Hover (or tap) and the orbit speeds up, then eases back down. It only runs while on screen,
  and stays still when the visitor prefers reduced motion.
*/
export default function TechOrbit() {
  const box = useRef(null);

  useEffect(() => {
    const el = box.current;
    if (!el || REDUCED) return;
    let raf, last = 0, rot = 0, speed = 1, target = 1, visible = false, boostUntil = 0;
    const tick = (t) => {
      const dt = last ? Math.min(t - last, 50) : 16;
      last = t;
      const want = t < boostUntil ? 5 : target;
      speed += (want - speed) * 0.05;
      rot = (rot + dt * 0.012 * speed) % 360;
      el.style.setProperty("--rot", `${rot}deg`);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (visible && !raf && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    };
    const io = new IntersectionObserver(([e]) => ((visible = e.isIntersecting), visible ? start() : stop()));
    io.observe(el);
    const vis = () => (document.hidden ? stop() : start());
    const enter = () => (target = 4);
    const leave = () => (target = 1);
    const tap = (e) => e.pointerType !== "mouse" && (boostUntil = performance.now() + 900);
    document.addEventListener("visibilitychange", vis);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", tap);
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", tap);
    };
  }, []);

  const all = ABOUT.orbit.flat().map((t) => t.n);
  return (
    <div className="orbit" ref={box} role="img" aria-label={`My stack: ${all.join(", ")}`}>
      {ABOUT.orbit.map((ring, r) => (
        <div className={`orbit-ring r${r}`} key={r} aria-hidden="true">
          {ring.map((t, i) => (
            <span className="orbit-item" key={t.n} style={{ "--a": `${(360 / ring.length) * i + r * 20}deg`, "--c": t.c }}>
              <i />{t.n}
            </span>
          ))}
        </div>
      ))}
      <img className="orbit-core" src={ABOUT.photo || "/me.jpg"} alt="" aria-hidden="true" />
    </div>
  );
}
