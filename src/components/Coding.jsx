import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING, haptic } from "../hooks/spring";
import { PLATFORMS } from "../data";
import { REDUCED, revealInRow } from "../hooks/motion";
import useInView from "../hooks/useInView";
import useTheme from "../hooks/theme";
import useStats from "../hooks/useStats";
import Glitch from "./Glitch";
import Reveal from "./Reveal";
import Odometer from "./Odometer";
import Icon from "./Icons";

const WEEKS = 53;
const DAY_MS = 86400000;
const dayIndex = (iso) => Math.floor(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / DAY_MS);

// LeetCode sends { unixSeconds: count }; GFG and GitHub send { "YYYY-MM-DD": count }. Normalise to day index → count.
const fromUnix = (cal) => {
  const out = {};
  for (const [ts, n] of Object.entries(cal || {})) {
    const d = Math.floor((+ts * 1000) / DAY_MS);
    out[d] = (out[d] || 0) + n;
  }
  return out;
};
const fromIso = (days) => {
  const out = {};
  for (const [iso, n] of Object.entries(days || {})) if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) out[dayIndex(iso)] = (out[dayIndex(iso)] || 0) + (+n || 0);
  return out;
};

// The platforms the contributions map can toggle between. c = the brand colour the squares are tinted with.
const SOURCES = [
  { id: "leetcode", label: "LeetCode", short: "LeetCode", c: "#ffa116", unit: "submissions", get: (s) => s?.leetcode?.calendar && fromUnix(s.leetcode.calendar), accounts: (s) => s?.leetcode?.accounts?.map((a) => ({ user: a.user, url: a.url, days: fromUnix(a.calendar) })), url: "https://leetcode.com/u/guruprasadgp22/", url2: "https://leetcode.com/u/guruprasad6200/" },
  { id: "gfg", label: "GeeksforGeeks", short: "GFG", c: "#2fbf5a", unit: "submissions", get: (s) => s?.gfg?.days && fromIso(s.gfg.days), url: "https://www.geeksforgeeks.org/profile/guruprasadgp22" },
  { id: "github", label: "GitHub", short: "GitHub", c: "#3de0ff", unit: "contributions", get: (s) => s?.github?.days && fromIso(s.github.days), url: "https://github.com/guruprasadgp22" },
  { id: "code360", label: "Code360", short: "Code360", c: "#f05b5b", unit: "submissions", get: (s) => s?.code360?.days && fromIso(s.code360.days), url: "https://www.naukri.com/code360/profile/guruprasadgp" },
  { id: "hackerrank", label: "HackerRank", short: "HackerRank", c: "#c6e55c", unit: "submissions", get: (s) => s?.hackerrank?.days && fromIso(s.hackerrank.days), accounts: (s) => s?.hackerrank?.accounts?.map((a) => ({ user: a.user, url: a.url, days: fromIso(a.days) })), url: "https://www.hackerrank.com/profile/guruprasad6200", url2: "https://www.hackerrank.com/profile/gp130143" },
  { id: "neetcode", label: "NeetCode", short: "NeetCode", c: "#ff5fa2", unit: "submissions", get: (s) => s?.neetcode?.days && fromIso(s.neetcode.days), url: "https://neetcode.io/user/PrimalPikachu220" },
  { id: "hackerearth", label: "HackerEarth", short: "HackerEarth", c: "#7b83ff", unit: "submissions", get: (s) => s?.hackerearth?.days && fromIso(s.hackerearth.days), url: "https://www.hackerearth.com/@guruprasadgp/" },
  { id: "interviewbit", label: "InterviewBit", short: "InterviewBit", c: "#14b8a6", unit: "submissions", get: (s) => s?.interviewbit?.days && fromIso(s.interviewbit.days), url: "https://www.interviewbit.com/profile/guruprasad-gp_339/" },
];
// "guruprasadgp22" from "https://leetcode.com/u/guruprasadgp22/"
const handleOf = (url) => url.replace(/\/+$/, "").split("/").pop().replace(/^@/, "");
// "All" adds every platform's activity together, day by day.
const ALL = { id: "all", label: "All platforms", short: "All", c: "#ff6a3d", unit: "activities" };
const mergeDays = (maps) => {
  const out = {};
  for (const m of maps) for (const [d, n] of Object.entries(m)) out[d] = (out[d] || 0) + n;
  return out;
};

// Lay the last 53 weeks out as columns (Sun → Sat), GitHub-style, with levels 0–4 set by quartiles
// of the active days, so a big GitHub day and a single LeetCode submission both read sensibly.
function grid(byDay) {
  const today = Math.floor(Date.now() / DAY_MS);
  const start = today - new Date().getUTCDay() - (WEEKS - 1) * 7;
  const counts = Array.from({ length: WEEKS * 7 }, (_, i) => (start + i > today ? -1 : byDay[start + i] || 0));
  const active = counts.filter((n) => n > 0).sort((a, b) => a - b);
  const q = (f) => active[Math.floor(f * (active.length - 1))] || 1;
  const cut = [q(0.25), q(0.5), q(0.75)];
  const level = (n) => (n <= 0 ? 0 : n <= cut[0] ? 1 : n <= cut[1] ? 2 : n <= cut[2] ? 3 : 4);
  let run = 0, best = 0;
  counts.forEach((n) => (n > 0 ? (best = Math.max(best, ++run)) : n === 0 && (run = 0)));
  // current streak: count back from today (today itself may still be empty)
  let cur = 0;
  for (let i = counts.length - 1; i >= 0; i--) {
    if (counts[i] < 0) continue;
    if (counts[i] > 0) cur++;
    else if (start + i !== today) break;
  }
  const months = [];
  for (let w = 0; w < WEEKS; w++) {
    const d = new Date((start + w * 7) * DAY_MS);
    if (d.getUTCDate() <= 7) months.push({ w, m: d.toLocaleString("en", { month: "short", timeZone: "UTC" }) });
  }
  const last = Math.max(-Infinity, ...Object.entries(byDay).filter(([, n]) => n > 0).map(([d]) => +d));
  const lastActive = Number.isFinite(last) ? new Date(last * DAY_MS).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : null;
  return { start, counts, levels: counts.map((n) => (n < 0 ? -1 : level(n))), total: active.reduce((a, b) => a + b, 0), active: active.length, best, cur, months, lastActive };
}

// Placeholder pattern, only used if no live data could be loaded at all.
function sample() {
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const byDay = {};
  const today = Math.floor(Date.now() / DAY_MS);
  for (let i = 0; i < WEEKS * 7; i++) if (rnd() > 0.35) byDay[today - i] = 1 + Math.floor(rnd() * 6);
  return byDay;
}

const GAP = 3, TOP = 18, LEFT = 26, MIN_CELL = 10, MAX_CELL = 13;
// Size the grid to the slide: all 53 weeks when they fit at 10px+, otherwise only the most recent weeks
// that do. That way nothing inside a slide scrolls sideways and fights the slide swipe.
const fitGrid = (w) => {
  const full = Math.floor((w - LEFT) / WEEKS) - GAP;
  if (full >= MIN_CELL) return { cell: Math.min(MAX_CELL, full), weeks: WEEKS };
  return { cell: MIN_CELL, weeks: Math.max(13, Math.floor((w - LEFT) / (MIN_CELL + GAP))) };
};

// Squares fade from the empty-cell colour to the platform's brand colour across levels 1–4.
const hexRgb = (h) => {
  const m = h.replace("#", "").match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const x = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
};
const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
const shades = (base, brand) => {
  const a = hexRgb(base), b = hexRgb(brand);
  return a && b ? [base, mix(a, b, 0.3), mix(a, b, 0.55), mix(a, b, 0.8), brand] : null;
};
const unitOf = (src, n) => (n === 1 ? src.unit.replace(/s$/, "") : src.unit);

// One canvas grid. It "paints" itself column by column whenever its slide becomes the active one,
// and hovering or tapping a day shows its count.
function Grid({ g, src, fit, animate, label }) {
  const canvas = useRef(null);
  const theme = useTheme();
  const [tip, setTip] = useState(null);
  // a fixed-position label would drift if the page scrolled under it
  useEffect(() => {
    if (!tip) return;
    const hide = () => setTip(null);
    addEventListener("scroll", hide, { passive: true, once: true });
    return () => removeEventListener("scroll", hide);
  }, [tip]);
  const { cell, weeks } = fit;
  const STEP = cell + GAP;
  const skip = WEEKS - weeks; // columns hidden on narrow screens (the oldest weeks)

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv.getContext("2d");
    const d = Math.min(devicePixelRatio || 1, 2);
    const W = LEFT + weeks * STEP, H = TOP + 7 * STEP;
    cv.width = W * d;
    cv.height = H * d;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    ctx.setTransform(d, 0, 0, d, 0, 0);
    const css = getComputedStyle(document.documentElement);
    const theme5 = [0, 1, 2, 3, 4].map((n) => css.getPropertyValue(`--heat-${n}`).trim());
    const cols = shades(theme5[0], src.c) || theme5;
    const ink = css.getPropertyValue("--mute").trim();
    const first = skip * 7;

    const paint = (upto) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = ink;
      ctx.font = "10px 'JetBrains Mono', monospace";
      g.months.forEach(({ w, m }) => w >= skip && w < WEEKS - 1 && ctx.fillText(m, LEFT + (w - skip) * STEP, 11));
      ["Mon", "Wed", "Fri"].forEach((t, k) => ctx.fillText(t, 0, TOP + (1 + k * 2) * STEP + 10));
      for (let i = first; i < g.levels.length; i++) {
        const v = g.levels[i];
        if (v < 0) continue;
        const x = LEFT + (Math.floor(i / 7) - skip) * STEP, y = TOP + (i % 7) * STEP;
        ctx.fillStyle = i - first < upto ? cols[v] : cols[0];
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, cell, cell, 3) : ctx.rect(x, y, cell, cell);
        ctx.fill();
      }
    };
    if (!animate || REDUCED) {
      paint(Infinity);
      return;
    }
    let k = 0, raf;
    const go = () => {
      k += 11;
      paint(k);
      if (k < weeks * 7) raf = requestAnimationFrame(go);
    };
    go();
    return () => cancelAnimationFrame(raf);
  }, [animate, theme, g, cell, weeks, src.c]);

  const point = (e) => {
    const r = canvas.current.getBoundingClientRect();
    const col = Math.floor((e.clientX - r.left - LEFT) / STEP), row = Math.floor((e.clientY - r.top - TOP) / STEP);
    const i = (col + skip) * 7 + row;
    if (col < 0 || row < 0 || row > 6 || col >= weeks || g.counts[i] < 0) return setTip(null);
    // the track clips anything that sticks out, so the label is positioned against the window instead
    const x = r.left + LEFT + col * STEP + cell / 2;
    setTip({
      n: g.counts[i],
      date: new Date((g.start + i) * DAY_MS).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
      x: Math.min(Math.max(x, 110), innerWidth - 110),
      y: r.top + TOP + row * STEP,
    });
  };

  return (
    <div className="heatgrid" onMouseMove={point} onMouseLeave={() => setTip(null)} onClick={point}>
      <canvas ref={canvas} role="img" aria-label={label} />
      {/* rendered on <body>: wrappers with a transform would otherwise shift a fixed-position label */}
      {createPortal(
        <AnimatePresence>
          {tip && (
            <motion.div className="heat-tip" style={{ left: tip.x, top: tip.y }} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              <b>{tip.n ? `${tip.n} ${unitOf(src, tip.n)}` : `No ${src.unit}`}</b> on {tip.date}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

// Everything for one view (All, or one platform): stats, the per-platform table on "All", and the grid.
// The four headline numbers for one calendar.
const Stats = ({ g, src }) => (
  <dl className="heat-stats">
    <div><dt>{src.unit}</dt><dd>{g.total.toLocaleString("en-IN")}</dd></div>
    <div><dt>active days</dt><dd>{g.active}</dd></div>
    <div><dt>longest streak</dt><dd>{g.best}d</dd></div>
    <div><dt>current streak</dt><dd>{g.cur}d</dd></div>
  </dl>
);

function Slide({ view, per, fit, animate, live, onChoose }) {
  const { src, g, accts } = view;
  const isAll = src === ALL;
  const months = Math.round(fit.weeks / 4.35);
  const label = live ? `${src.label}: ${g.total.toLocaleString("en-IN")} ${src.unit} on ${g.active} days in the last year` : "Sample activity heatmap";
  return (
    <div className="heat-slide" style={{ "--c": src.c }} role="tabpanel" aria-label={src.label}>
      {!accts && <Stats g={g} src={src} />}
      {isAll && live && (
        <div className="heat-table-wrap">
          <table className="heat-table">
            <thead>
              <tr><th scope="col">Platform</th><th scope="col">Total</th><th scope="col">Active days</th><th scope="col">Longest streak</th><th scope="col">Current streak</th></tr>
            </thead>
            <tbody>
              {per.map(({ src: ps, g: pg }) => (
                <tr key={ps.id} style={{ "--c": ps.c }}>
                  <th scope="row">
                    {pg ? <button onClick={() => onChoose(ps.id)}><i aria-hidden="true" />{ps.label}</button> : <span><i aria-hidden="true" />{ps.label}</span>}
                  </th>
                  {pg && !pg.active ? (
                    <td colSpan={4} className="na">no activity in the last 12 months{pg.lastActive ? ` · last active ${pg.lastActive}` : ""}</td>
                  ) : pg ? (
                    <>
                      <td data-label="total">{pg.total.toLocaleString("en-IN")} <small>{ps.unit}</small></td>
                      <td data-label="active">{pg.active}</td>
                      <td data-label="longest">{pg.best}d</td>
                      <td data-label="current">{pg.cur}d</td>
                    </>
                  ) : (
                    <td colSpan={4} className="na">couldn't load right now</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {accts ? (
        // a platform with several profiles: one map per account, each with its own numbers
        accts.map((a) => (
          <section className="heat-acct" key={a.user} aria-label={`@${a.user}`}>
            <a className="heat-acct-hd" href={a.url} target="_blank" rel="noopener noreferrer">@{a.user} <span aria-hidden="true">↗</span></a>
            <Stats g={a.g} src={src} />
            {!a.g.active && <p className="heat-empty">No activity on this account in the last 12 months{a.g.lastActive ? ` · last active ${a.g.lastActive}` : ""}</p>}
            <Grid g={a.g} src={src} fit={fit} animate={animate} label={`${src.label} @${a.user}: ${a.g.total.toLocaleString("en-IN")} ${src.unit} on ${a.g.active} days in the last year`} />
          </section>
        ))
      ) : (
        <>
          {live && !g.active && (
            <p className="heat-empty">No {src.label} activity in the last 12 months{g.lastActive ? ` · last active ${g.lastActive}` : ""}</p>
          )}
          <Grid g={g} src={src} fit={fit} animate={animate} label={label} />
        </>
      )}
      <div className="heat-ft">
        <span>
          {isAll ? "All platforms added together · " : accts ? `${accts.length} accounts, each on its own · ` : ""}
          {fit.weeks < WEEKS ? `last ${months} months shown · stats cover 12 months` : "last 12 months"}
        </span>
        <span className="legend">less {[0.08, 0.3, 0.55, 0.8, 1].map((t) => <i key={t} style={{ background: `color-mix(in srgb, ${src.c} ${t * 100}%, var(--heat-0))` }} />)} more</span>
      </div>
    </div>
  );
}

/*
  Contributions carousel: All first, then one slide per platform, side by side in a horizontal track that
  snaps slide by slide. Swipe (or trackpad-scroll) it, use the ‹ › buttons or arrow keys, or tap a toggle;
  the toggles and the header follow whichever slide is showing.
*/
function Heatmap({ stats }) {
  const wrap = useRef(null);
  const track = useRef(null);
  const toggles = useRef(null);
  const seen = useInView(wrap, 0.3);
  const [idx, setIdx] = useState(0);
  const [fit, setFit] = useState({ cell: 12, weeks: WEEKS });
  const [heights, setHeights] = useState([]);

  // every platform's calendar and its stats, worked out once per stats load
  const per = useMemo(() => SOURCES.map((src) => {
    const days = src.get(stats);
    const accts = days && src.accounts?.(stats)?.map((a) => ({ ...a, g: grid(a.days) }));
    return { src, days, g: days ? grid(days) : null, accts: accts?.length > 1 ? accts : null };
  }), [stats]);
  const live = per.some((x) => x.g);
  const views = useMemo(() => {
    const all = { src: ALL, g: live ? grid(mergeDays(per.filter((x) => x.days).map((x) => x.days))) : grid(sample()) };
    return [all, ...per.filter((x) => x.g)];
  }, [per, live]);
  const i = Math.min(idx, views.length - 1);
  const cur = views[i].src;

  // size the grids to the slide width
  useEffect(() => {
    const el = track.current;
    const measure = () => el && setFit(fitGrid(el.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // the track takes the height of the slide that's showing, so short slides don't leave a gap
  useEffect(() => {
    const slides = [...track.current.children];
    const read = () => setHeights(slides.map((s) => s.offsetHeight));
    read();
    const ro = new ResizeObserver(read);
    slides.forEach((s) => ro.observe(s));
    return () => ro.disconnect();
  }, [views]);

  // follow the scroll position: whichever slide is mostly in view is the active one
  useEffect(() => {
    const el = track.current;
    let raf;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))));
    };
    el.addEventListener("scroll", on, { passive: true });
    return () => {
      el.removeEventListener("scroll", on);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    revealInRow(toggles.current, toggles.current?.querySelector('[aria-selected="true"]'));
  }, [i]);

  const goTo = (n) => {
    const el = track.current;
    const to = Math.max(0, Math.min(views.length - 1, n));
    haptic(5);
    el.scrollTo({ left: to * el.clientWidth, behavior: REDUCED ? "auto" : "smooth" });
  };
  const choose = (id) => goTo(views.findIndex((v) => v.src.id === id));
  const onKey = (e) => {
    if (e.key === "ArrowRight") (e.preventDefault(), goTo(i + 1));
    if (e.key === "ArrowLeft") (e.preventDefault(), goTo(i - 1));
  };

  return (
    <div className="heat" ref={wrap} style={{ "--c": cur.c }}>
      <div className="hd">
        <span className="heat-title"><i style={{ background: cur.c }} />{cur.label}{!live && " (sample)"}</span>
        <span className="heat-nav">
          {cur.url && (
            <span className="heat-link">
              <a href={cur.url} target="_blank" rel="noopener noreferrer">{cur.url2 ? `@${handleOf(cur.url)} ↗` : "View profile ↗"}</a>
              {cur.url2 && <> · <a href={cur.url2} target="_blank" rel="noopener noreferrer">@{handleOf(cur.url2)} ↗</a></>}
            </span>
          )}
          <span className="heat-arrows">
            <button onClick={() => goTo(i - 1)} disabled={i === 0} aria-label="Previous platform"><Icon name="next" size={16} /></button>
            <button onClick={() => goTo(i + 1)} disabled={i === views.length - 1} aria-label="Next platform"><Icon name="next" size={16} /></button>
          </span>
        </span>
      </div>
      <div className="heat-toggles" ref={toggles} role="tablist" aria-label="Choose a platform">
        {[ALL, ...SOURCES].map((src) => {
          const ok = views.some((v) => v.src.id === src.id);
          const on = cur.id === src.id;
          return (
            <button key={src.id} role="tab" aria-selected={on} disabled={!ok} title={ok ? undefined : `${src.label} data couldn't be loaded right now`} className={on ? "on" : ""} style={{ "--c": src.c }} onClick={() => choose(src.id)}>
              {on && <motion.span className="heat-pill" layoutId="heat-pill" transition={SPRING} />}
              <i aria-hidden="true" />
              <span>{src.short}</span>
            </button>
          );
        })}
      </div>
      <div className="heat-dots" aria-hidden="true">
        {views.map((v, k) => <i key={v.src.id} className={k === i ? "on" : ""} style={{ "--c": v.src.c }} />)}
      </div>
      <div className="heat-track" ref={track} tabIndex={0} onKeyDown={onKey} aria-label="Contribution maps, swipe or use arrow keys" style={heights[i] ? { height: heights[i] } : undefined}>
        {views.map((v, k) => (
          <Slide key={v.src.id} view={v} per={per} fit={fit} live={live} animate={seen && k === i} onChoose={choose} />
        ))}
      </div>
    </div>
  );
}

// Overlay live numbers on the platform cards from data.js; any source that failed keeps its saved values.
export function withLive(p, s) {
  if (!s) return p;
  if (p.n === "LeetCode" && s.leetcode) {
    const l = s.leetcode;
    return {
      ...p,
      val: l.solved,
      lbl: `problems solved · ${l.easy} E / ${l.medium} M / ${l.hard} H${l.accounts?.length > 1 ? ` · best of ${l.accounts.length} accounts` : ""}`,
      meta: [["Rating", l.rating ?? "–"], ["Max streak", `${l.streak ?? 0}d`]],
      accounts: l.accounts?.map((a) => ({ user: a.user, url: a.url, val: a.solved, note: `${a.easy} E / ${a.medium} M / ${a.hard} H` })) ?? p.accounts,
      live: true,
    };
  }
  if (p.n === "GeeksforGeeks" && s.gfg) {
    return { ...p, val: s.gfg.solved, meta: [["Score", s.gfg.score], ["Institute", `#${s.gfg.instituteRank}`]], live: true };
  }
  if (p.n === "Code360" && s.code360) {
    return { ...p, val: s.code360.solved, meta: [["Moderate", s.code360.Moderate ?? 0], ["Hard", s.code360.Hard ?? 0]], live: true };
  }
  if (p.n === "HackerRank" && s.hackerrank) {
    const h = s.hackerrank;
    const [skill, stars] = Object.entries(h.stars || {}).sort((a, b) => b[1] - a[1])[0] || [];
    return {
      ...p,
      val: h.solved,
      lbl: `challenges solved${h.accounts.length > 1 ? ` · best of ${h.accounts.length} accounts` : ""}`,
      accounts: h.accounts.map((a) => ({
        user: a.user, url: a.url, val: a.solved,
        note: [a.best && `${a.best.skill === "Sql" ? "SQL" : a.best.skill} ${a.best.stars}★`, a.certs && `${a.certs} certificate${a.certs === 1 ? "" : "s"}`].filter(Boolean).join(" · ") || "no badges yet",
      })),
      meta: [...(skill ? [[skill === "Sql" ? "SQL" : skill, `${stars}★`]] : []), ["Certificates", h.certs?.length ?? 0]],
      live: true,
    };
  }
  if (p.n === "HackerEarth" && s.hackerearth) {
    const h = s.hackerearth;
    return {
      ...p,
      val: h.solved ?? p.val,
      lbl: `problems solved${h.submitted ? ` · ${h.submitted} submissions` : ""}`,
      meta: [["Score", h.score ?? "–"], ...(h.rank ? [["Rank", `Top ${h.rank.top}%`]] : [])],
      live: true,
    };
  }
  if (p.n === "InterviewBit" && s.interviewbit) {
    const b = s.interviewbit;
    return {
      ...p,
      val: b.solved,
      lbl: `problems solved · score ${b.score.toLocaleString("en-IN")}`,
      meta: [...(b.universityRank ? [["University rank", `#${b.universityRank}`]] : []), ["Streak", `${b.streak ?? 0}d`]],
      live: true,
    };
  }
  if (p.n === "NeetCode" && s.neetcode) {
    const n = s.neetcode;
    return {
      ...p,
      val: n.solved,
      lbl: `problems solved · ${n.easy} E / ${n.medium} M / ${n.hard} H`,
      meta: [["Max streak", `${n.maxStreak ?? 0}d`], ...(n.top != null ? [["Rank", `Top ${n.top}%`]] : [])],
      live: true,
    };
  }
  return p;
}

// Every platform with live numbers where available. One with no number yet (val: null in data.js) is left out.
export const livePlatforms = (stats) => PLATFORMS.map((p) => withLive(p, stats)).filter((p) => p.val != null);

export default function Coding() {
  const stats = useStats();
  const platforms = livePlatforms(stats);
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
          // a platform with several profiles isn't one big link: each profile gets its own row and link
          <Reveal as={p.accounts ? "div" : "a"} delay={k * 80} key={p.n} className={`plat ${p.accounts ? "multi" : ""}`} {...(!p.accounts && { href: p.url, target: "_blank", rel: "noopener noreferrer" })} style={{ "--c": p.c }}>
            <span className="pn">{p.n}{p.live && <i className="live-dot" title="Live" />}</span>
            <span className="val"><Odometer value={p.val} suffix="+" /></span>
            <span className="lbl">{p.lbl}</span>
            <span className="meta">
              {p.meta.map(([a, b]) => <span key={a}>{a} <b>{b}</b></span>)}
            </span>
            {p.accounts && (
              <ul className="plat-accts" aria-label={`${p.n} profiles`}>
                {p.accounts.map((a) => (
                  <li key={a.user}>
                    <a href={a.url} target="_blank" rel="noopener noreferrer">
                      <span className="who">@{a.user}<small>{a.note}</small></span>
                      <b>{a.val.toLocaleString("en-IN")}</b>
                      <span className="go" aria-hidden="true">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        ))}
      </div>
      <h3 className="h3 heat-h">Contributions</h3>
      <Reveal><Heatmap stats={stats} /></Reveal>
      <p className="note">
        {updated
          ? `// Live from LeetCode, GFG, GitHub, Code360, HackerRank, HackerEarth, NeetCode and InterviewBit · refreshed ${updated.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
          : "// Saved stats from public profiles. Live numbers load on the deployed site."}
      </p>
    </>
  );
}
