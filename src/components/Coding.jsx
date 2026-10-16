import { useEffect, useMemo, useRef } from "react";
import { PLATFORMS } from "../data";
import { REDUCED } from "../hooks/motion";
import useInView from "../hooks/useInView";
import useTheme from "../hooks/theme";
import useStats from "../hooks/useStats";
import Glitch from "./Glitch";
import Reveal from "./Reveal";
import Odometer from "./Odometer";

const WEEKS = 52;
const DAY = 86400;
const level = (n) => (n <= 0 ? 0 : n <= 2 ? 1 : n <= 4 ? 2 : n <= 8 ? 3 : 4);

// Turn LeetCode's { unixSeconds: count } calendar into 52 weeks × 7 days of levels, oldest first.
function fromCalendar(calendar) {
  const byDay = {};
  for (const [ts, n] of Object.entries(calendar)) byDay[Math.floor(+ts / DAY)] = (byDay[Math.floor(+ts / DAY)] || 0) + n;
  const today = Math.floor(Date.now() / 1000 / DAY);
  const weekday = new Date().getUTCDay(); // 0 = Sunday, so each column is Sun → Sat
  const start = today - weekday - (WEEKS - 1) * 7;
  let total = 0, active = 0;
  const vals = Array.from({ length: WEEKS * 7 }, (_, i) => {
    const day = start + i;
    if (day > today) return -1; // future days in the current week stay empty
    const n = byDay[day] || 0;
    total += n;
    if (n) active++;
    return level(n);
  });
  return { vals, total, active };
}

// Placeholder pattern, only used if live data can't be loaded.
function sample() {
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: WEEKS * 7 }, (_, i) => {
    const r = rnd(), ramp = i / (WEEKS * 7);
    return r < 0.25 - ramp * 0.15 ? 0 : Math.min(4, Math.floor(r * 4 + ramp * 2));
  });
}

// Activity grid that "paints" itself column by column when it scrolls into view.
function Heatmap({ calendar }) {
  const canvas = useRef(null);
  const wrap = useRef(null);
  const seen = useInView(wrap, 0.3);
  const theme = useTheme();
  const live = useMemo(() => (calendar ? fromCalendar(calendar) : null), [calendar]);
  const vals = useMemo(() => live?.vals || sample(), [live]);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv.getContext("2d");
    const cell = 12, gap = 3, d = Math.min(devicePixelRatio || 1, 2);
    const W = WEEKS * (cell + gap), H = 7 * (cell + gap);
    cv.width = W * d;
    cv.height = H * d;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const css = getComputedStyle(document.documentElement);
    const cols = [0, 1, 2, 3, 4].map((n) => css.getPropertyValue(`--heat-${n}`).trim());

    const paint = (upto) => {
      ctx.clearRect(0, 0, W, H);
      vals.forEach((v, i) => {
        if (v < 0) return;
        const x = Math.floor(i / 7) * (cell + gap), y = (i % 7) * (cell + gap);
        ctx.fillStyle = i < upto ? cols[v] : cols[0];
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, cell, cell, 3) : ctx.rect(x, y, cell, cell);
        ctx.fill();
      });
    };
    if (!seen || REDUCED) {
      paint(vals.length);
      return;
    }
    let k = 0, raf;
    const go = () => {
      k += 9;
      paint(k);
      if (k < vals.length) raf = requestAnimationFrame(go);
    };
    go();
    return () => cancelAnimationFrame(raf);
  }, [seen, theme, vals]);

  return (
    <div className="heat" ref={wrap}>
      <div className="hd">
        <span>
          {live
            ? `LeetCode · ${live.total.toLocaleString("en-IN")} submissions · ${live.active} active days in the last year`
            : "Daily problem-solving · last 12 months (sample)"}
        </span>
        <span className="legend">less <i /><i /><i /><i /><i /> more</span>
      </div>
      <div className="heatgrid">
        <canvas ref={canvas} role="img" aria-label={live ? `LeetCode activity: ${live.active} active days in the last year` : "Sample activity heatmap"} />
      </div>
    </div>
  );
}

// Overlay live numbers on the platform cards from data.js; any source that failed keeps its saved values.
function withLive(p, s) {
  if (!s) return p;
  if (p.n === "LeetCode" && s.leetcode) {
    const l = s.leetcode;
    return { ...p, val: l.solved, lbl: `problems solved · ${l.easy} E / ${l.medium} M / ${l.hard} H`, meta: [["Rating", l.rating ?? "–"], ["Max streak", `${l.streak ?? 0}d`]], live: true };
  }
  if (p.n === "GeeksforGeeks" && s.gfg) {
    return { ...p, val: s.gfg.solved, meta: [["Score", s.gfg.score], ["Institute", `#${s.gfg.instituteRank}`]], live: true };
  }
  if (p.n === "Code360" && s.code360) {
    return { ...p, val: s.code360.solved, meta: [["Moderate", s.code360.Moderate ?? 0], ["Hard", s.code360.Hard ?? 0]], live: true };
  }
  return p;
}

export default function Coding() {
  const stats = useStats();
  const platforms = PLATFORMS.map((p) => withLive(p, stats));
  const total = platforms.reduce((s, p) => s + p.val, 0);
  const updated = stats?.updated && new Date(stats.updated);

  return (
    <>
      <Glitch text="Coding" />
      <p className="lead-line">
        <b><Odometer value={total} suffix="+" /></b> problems solved across {platforms.length} platforms, and counting.
      </p>
      <div className="cp">
        {platforms.map((p, k) => (
          <Reveal as="a" delay={k * 80} key={p.n} className="plat" href={p.url} target="_blank" rel="noopener noreferrer" style={{ "--c": p.c }}>
            <span className="pn">{p.n}{p.live && <i className="live-dot" title="Live" />}</span>
            <span className="val"><Odometer value={p.val} suffix="+" /></span>
            <span className="lbl">{p.lbl}</span>
            <span className="meta">
              {p.meta.map(([a, b]) => <span key={a}>{a} <b>{b}</b></span>)}
            </span>
          </Reveal>
        ))}
      </div>
      <Reveal><Heatmap calendar={stats?.leetcode?.calendar} /></Reveal>
      <p className="note">
        {updated
          ? `// Live from LeetCode, GFG and Code360 · refreshed ${updated.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}. NeetCode is updated by hand.`
          : "// Saved stats from public profiles. Live numbers load on the deployed site."}
      </p>
    </>
  );
}
