import { useEffect, useRef } from "react";
import { REDUCED } from "../hooks/motion";

/*
  Constellation of drifting particles behind the hero.
  Particles flee from the cursor (or finger) and link up with nearby neighbours.
  Fewer particles on small screens; pauses when the tab is hidden or the hero is off-screen.
*/
export default function ParticleField() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const ember = css.getPropertyValue("--ember").trim();
    const signal = css.getPropertyValue("--signal").trim();
    let w, h, pts = [], raf, visible = true;
    const mouse = { x: -999, y: -999 };

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.offsetWidth;
      h = cv.offsetHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(110, (w * h) / 14000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.8 + 0.6,
        c: Math.random() < 0.7 ? ember : signal,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 140 && d > 0) {
          p.vx += (dx / d) * 0.25;
          p.vy += (dy / d) * 0.25;
        }
        p.vx = p.vx * 0.97 + (Math.random() - 0.5) * 0.03;
        p.vy = p.vy * 0.97 + (Math.random() - 0.5) * 0.03;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) {
            ctx.globalAlpha = (1 - d / 120) * 0.35;
            ctx.strokeStyle = a.c;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      ctx.globalAlpha = 1;
      for (const p of pts) {
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!REDUCED && visible && !document.hidden) raf = requestAnimationFrame(draw);
    };

    const restart = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) draw();
    };
    const mm = (e) => {
      const r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    };
    const tm = (e) => e.touches[0] && mm(e.touches[0]);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      restart();
    });

    size();
    draw();
    io.observe(cv);
    addEventListener("resize", size);
    addEventListener("mousemove", mm);
    addEventListener("touchmove", tm, { passive: true });
    document.addEventListener("visibilitychange", restart);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      removeEventListener("resize", size);
      removeEventListener("mousemove", mm);
      removeEventListener("touchmove", tm);
      document.removeEventListener("visibilitychange", restart);
    };
  }, []);

  return <canvas id="field" ref={ref} aria-hidden="true" />;
}
