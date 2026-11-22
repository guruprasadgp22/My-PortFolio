import { useEffect, useRef } from "react";
import { REDUCED } from "../hooks/motion";

/*
  Halftone portrait: an old black-and-white print made of dots, with a cartoon look.
  - halftoneDots() reads a cut-out picture (transparent background) on a grid. Brightness is spread over the
    whole range (histogram equalisation, so a face in shadow keeps its features), flattened into a few steps
    (the cartoon look) and every cell becomes a dot: bigger where the picture is brighter. Strong edges become
    full dots (the ink line of a comic) and the outer outline gets the accent colour.
  - drawHalftone() paints them, animated: the dots ripple in from the middle, breathe in a slow wave, swell
    as a scanner band passes, and shy away from a pointer. Used by the component below and by the CRT screen
    on the Home page (components/Retro3D.js).
*/
export function halftoneDots(img, { x: ox = 0, y: oy = 0, w: W, h: H }, step) {
  // fit inside the box, anchored to the bottom centre
  const s = Math.min(W / img.naturalWidth, H / img.naturalHeight);
  const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
  const left = ox + (W - iw) / 2, top = oy + H - ih;
  const cols = Math.max(1, Math.floor(iw / step)), rows = Math.max(1, Math.floor(ih / step));
  const off = document.createElement("canvas");
  off.width = cols; off.height = rows;
  const o = off.getContext("2d", { willReadFrequently: true });
  o.drawImage(img, 0, 0, cols, rows);
  const px = o.getImageData(0, 0, cols, rows).data;
  const L = new Float32Array(cols * rows), A = new Float32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    A[i] = px[i * 4 + 3] / 255;
    L[i] = (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255;
  }
  const hist = new Uint32Array(256);
  let n = 0;
  for (let i = 0; i < cols * rows; i++) if (A[i] >= 0.4) (hist[Math.round(L[i] * 255)]++, n++);
  const cdf = new Float32Array(256);
  for (let i = 0, run = 0; i < 256; i++) (run += hist[i], (cdf[i] = n ? run / n : i / 255));
  for (let i = 0; i < cols * rows; i++) L[i] = cdf[Math.round(L[i] * 255)];
  const at = (arr, x, y) => arr[Math.min(rows - 1, Math.max(0, y)) * cols + Math.min(cols - 1, Math.max(0, x))];
  const dots = [];
  const cx = left + iw / 2, cy = top + ih * 0.3;
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (A[y * cols + x] < 0.4) continue;
    const l = Math.round(L[y * cols + x] * 5) / 5; // 6 flat steps
    const gx = at(L, x + 1, y - 1) + 2 * at(L, x + 1, y) + at(L, x + 1, y + 1) - at(L, x - 1, y - 1) - 2 * at(L, x - 1, y) - at(L, x - 1, y + 1);
    const gy = at(L, x - 1, y + 1) + 2 * at(L, x, y + 1) + at(L, x + 1, y + 1) - at(L, x - 1, y - 1) - 2 * at(L, x, y - 1) - at(L, x + 1, y - 1);
    const line = Math.hypot(gx, gy) > 1.6;
    const rim = at(A, x - 1, y) < 0.4 || at(A, x + 1, y) < 0.4 || at(A, x, y - 1) < 0.4;
    const base = rim ? 0.42 : line ? Math.max(0.5, 0.08 + l * 0.5) : 0.06 + l * 0.5;
    const X = left + (x + 0.5) * (iw / cols), Y = top + (y + 0.5) * (ih / rows);
    dots.push({ x: X, y: Y, r: base * step, e: rim, d: Math.hypot(X - cx, Y - cy) });
  }
  return { dots, box: { x: left, y: top, w: iw, h: ih } };
}

// el = seconds since the portrait appeared; mouse = {x, y} in the same space as the dots (or far away)
export function drawHalftone(ctx, { dots, box }, el, { ink, edge, mouse, still = REDUCED, push = 14, reach = 95 } = {}) {
  const band = box.y + ((el * 0.12) % 1.3 - 0.15) * box.h; // the scanner band, top to bottom every ~11 s
  const fill = new Path2D(), rim = new Path2D();
  const r2 = reach * reach;
  for (const p of dots) {
    const grow = still ? 1 : Math.min(1, Math.max(0, (el * 900 - p.d) / 220)); // ripple in from the middle
    if (grow <= 0) continue;
    let r = p.r * grow, x = p.x, y = p.y;
    if (!still) {
      r *= 1 + 0.1 * Math.sin(el * 1.6 - p.y * 0.025 + p.x * 0.01);
      const b = 1 - Math.min(1, Math.abs(p.y - band) / 60);
      if (b > 0) r *= 1 + 0.45 * b;
      if (mouse) {
        const dx = x - mouse.x, dy = y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < r2) {
          const d = Math.sqrt(d2) || 1, f = 1 - d / reach;
          x += (dx / d) * f * push; y += (dy / d) * f * push; r *= 1 - f * 0.55;
        }
      }
    }
    if (r < 0.35) continue;
    const path = p.e ? rim : fill;
    path.moveTo(x + r, y);
    path.arc(x, y, r, 0, Math.PI * 2);
  }
  ctx.fillStyle = ink; ctx.fill(fill);
  ctx.fillStyle = edge; ctx.fill(rim);
}

// The portrait on its own canvas (used where the 3D scene can't run).
export default function Halftone({ src, step = 6, ink = "#f3ead8", edge = "#ffb27a", className = "", label }) {
  const box = useRef(null);
  const cv = useRef(null);

  useEffect(() => {
    const wrap = box.current, canvas = cv.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = src;
    let art = null, W = 0, H = 0, dpr = 1, raf = 0, visible = true, start = 0, alive = true;
    const mouse = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };
    const build = () => {
      if (!img.naturalWidth) return;
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`; canvas.style.height = `${H}px`;
      art = halftoneDots(img, { w: W, h: H }, step);
    };
    const draw = (t) => {
      if (!art) return;
      if (!start) start = t;
      mouse.x += (mouse.tx - mouse.x) * 0.15; mouse.y += (mouse.ty - mouse.y) * 0.15;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      drawHalftone(ctx, art, (t - start) / 1000, { ink, edge, mouse });
    };
    const loop = (t) => { draw(t); raf = alive && visible && !REDUCED ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf && alive && visible) raf = requestAnimationFrame(loop); };
    img.onload = () => { build(); REDUCED ? draw(performance.now()) : kick(); };
    const ro = new ResizeObserver(() => { build(); if (REDUCED) draw(performance.now()); });
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
    io.observe(wrap);
    const move = (e) => { const r = canvas.getBoundingClientRect(); mouse.tx = e.clientX - r.left; mouse.ty = e.clientY - r.top; };
    addEventListener("pointermove", move, { passive: true });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      removeEventListener("pointermove", move);
    };
  }, [src, step, ink, edge]);

  return (
    <div className={`halftone ${className}`} ref={box} role="img" aria-label={label}>
      <canvas ref={cv} />
    </div>
  );
}
