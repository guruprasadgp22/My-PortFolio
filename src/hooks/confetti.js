import { REDUCED } from "./motion";

// A small confetti burst for little wins (spotting the lie, sending a message, copying the email).
// One throwaway canvas, about 1.2 seconds, no library. Skipped when the visitor prefers reduced motion.
const COLORS = ["#ff6a3d", "#ffb547", "#3de0ff", "#3ddc84", "#ff5fa2"];

export default function confetti(from) {
  if (REDUCED || typeof document === "undefined") return;
  const r = from?.getBoundingClientRect?.();
  const x0 = r ? r.left + r.width / 2 : innerWidth / 2;
  const y0 = r ? r.top + r.height / 2 : innerHeight / 3;
  const cv = document.createElement("canvas");
  const d = Math.min(devicePixelRatio || 1, 2);
  cv.width = innerWidth * d;
  cv.height = innerHeight * d;
  cv.className = "confetti";
  cv.setAttribute("aria-hidden", "true");
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  ctx.scale(d, d);
  const bits = Array.from({ length: 70 }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const v = 5 + Math.random() * 7;
    return { x: x0, y: y0, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: COLORS[(Math.random() * COLORS.length) | 0] };
  });
  const start = performance.now();
  const tick = (t) => {
    const k = (t - start) / 1200;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = Math.max(0, 1 - k * k);
    for (const b of bits) {
      b.vy += 0.28;
      b.vx *= 0.985;
      b.x += b.vx;
      b.y += b.vy;
      b.r += b.vr;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.r);
      ctx.fillStyle = b.c;
      ctx.fillRect(-b.s / 2, -b.s / 4, b.s, b.s / 2);
      ctx.restore();
    }
    k < 1 ? requestAnimationFrame(tick) : cv.remove();
  };
  requestAnimationFrame(tick);
}
