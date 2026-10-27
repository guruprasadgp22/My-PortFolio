import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { SPRING, haptic } from "../hooks/spring";
import { livePlatforms } from "../platforms";
import { REDUCED } from "../hooks/motion";
import { startScroll, stopScroll } from "../hooks/useSmoothScroll";
import { useDragControls } from "framer-motion";
import useTheme from "../hooks/theme";
import useStats from "../hooks/useStats";
import Glitch from "./Glitch";
import Reveal from "./Reveal";
import Odometer from "./Odometer";
import Icon from "./Icons";
import Profile from "./Profile";
import { profileOf } from "../profiles";

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
  { id: "leetcode", label: "LeetCode", short: "LeetCode", c: "#ffa116", unit: "submissions", get: (s) => s?.leetcode?.calendar && fromUnix(s.leetcode.calendar), accounts: (s) => s?.leetcode?.accounts?.map((a) => ({ user: a.user, url: a.url, days: fromUnix(a.calendar), raw: a })), url: "https://leetcode.com/u/guruprasadgp22/", url2: "https://leetcode.com/u/guruprasad6200/" },
  { id: "gfg", label: "GeeksforGeeks", short: "GFG", c: "#2fbf5a", unit: "submissions", get: (s) => s?.gfg?.days && fromIso(s.gfg.days), url: "https://www.geeksforgeeks.org/profile/guruprasadgp22" },
  { id: "github", label: "GitHub", short: "GitHub", c: "#3de0ff", unit: "contributions", get: (s) => s?.github?.days && fromIso(s.github.days), url: "https://github.com/guruprasadgp22" },
  { id: "code360", label: "Code360", short: "Code360", c: "#f05b5b", unit: "submissions", get: (s) => s?.code360?.days && fromIso(s.code360.days), url: "https://www.naukri.com/code360/profile/guruprasadgp" },
  { id: "hackerrank", label: "HackerRank", short: "HackerRank", c: "#c6e55c", unit: "submissions", get: (s) => s?.hackerrank?.days && fromIso(s.hackerrank.days), accounts: (s) => s?.hackerrank?.accounts?.map((a) => ({ user: a.user, url: a.url, days: fromIso(a.days), raw: a })), url: "https://www.hackerrank.com/profile/guruprasad6200", url2: "https://www.hackerrank.com/profile/gp130143" },
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
    addEventListener("scroll", hide, { passive: true, once: true, capture: true }); // any scroller, not just the window
    return () => removeEventListener("scroll", hide, { capture: true });
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

// The four headline numbers for one calendar.
const Stats = ({ g, src }) => (
  <dl className="heat-stats">
    <div><dt>{src.unit}</dt><dd>{g.total.toLocaleString("en-IN")}</dd></div>
    <div><dt>active days</dt><dd>{g.active}</dd></div>
    <div><dt>longest streak</dt><dd>{g.best}d</dd></div>
    <div><dt>current streak</dt><dd>{g.cur}d</dd></div>
  </dl>
);

// A year of activity: headline numbers, the map, and its legend.
function Activity({ g, src, fit, label, title, note }) {
  const months = Math.round(fit.weeks / 4.35);
  return (
    <section className="cd-sec">
      <h5 className="pf-sub">{title}</h5>
      <Stats g={g} src={src} />
      {!g.active && <p className="heat-empty">No activity in the last 12 months{g.lastActive ? ` · last active ${g.lastActive}` : ""}</p>}
      <Grid g={g} src={src} fit={fit} animate label={label} />
      <div className="heat-ft">
        <span>{note ? `${note} · ` : ""}{fit.weeks < WEEKS ? `last ${months} months shown · stats cover 12 months` : "last 12 months"}</span>
        <span className="legend">less {[0.08, 0.3, 0.55, 0.8, 1].map((t) => <i key={t} style={{ background: `color-mix(in srgb, ${src.c} ${t * 100}%, var(--heat-0))` }} />)} more</span>
      </div>
    </section>
  );
}

// Platforms in the order the tiles show them; card = the matching entry in PLATFORMS (data.js).
const ORDER = ["leetcode", "gfg", "neetcode", "hackerrank", "interviewbit", "code360", "hackerearth", "github"];
const CARD = { leetcode: "LeetCode", gfg: "GeeksforGeeks", neetcode: "NeetCode", hackerrank: "HackerRank", interviewbit: "InterviewBit", code360: "Code360", hackerearth: "HackerEarth" };
const fromHash = () => location.hash.slice(1).split("/")[1] || null;
const nf = (n) => Number(n).toLocaleString("en-IN");

// Small stacked bar of easy / medium / hard on a tile, with the numbers written underneath.
function MiniLevels({ levels }) {
  const lv = levels?.filter((l) => l.n > 0) || [];
  const sum = lv.reduce((t, l) => t + l.n, 0);
  if (!sum) return null;
  return (
    <span className="ct-lv">
      <span className="ct-bar" aria-hidden="true">{lv.map((l) => <i key={l.k} className={`lv-${l.c}`} style={{ flexGrow: l.n }} />)}</span>
      <small aria-label={lv.map((l) => `${l.k} ${l.n}`).join(", ")}>{lv.map((l) => `${l.k[0]}${l.n}`).join("  ")}</small>
    </span>
  );
}

// Everything about one platform: account switcher, solved / badges profile, and the activity map.
function Detail({ t, stats, onClose }) {
  const box = useRef(null);
  const [fit, setFit] = useState({ cell: 12, weeks: WEEKS });
  const accts = useMemo(() => t.src.accounts?.(stats) || [], [t.id, stats]);
  const top = accts.length ? accts.reduce((a, b, i) => ((b.raw?.solved || 0) > (accts[a].raw?.solved || 0) ? i : a), 0) : 0;
  const [k, setK] = useState(top);
  const acct = accts[k];

  useEffect(() => {
    const el = box.current;
    const ro = new ResizeObserver(() => setFit(fitGrid(el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const g = useMemo(() => {
    const days = acct ? acct.days : t.src.get(stats);
    return days ? grid(days) : null;
  }, [acct, t.id, stats]);
  const profile = t.id === "github" ? null : profileOf(t.id, stats, acct?.raw);
  const links = accts.length ? accts.map((a) => ({ url: a.url, text: `@${a.user}` })) : t.src.url ? [{ url: t.src.url, text: "View profile" }] : [];

  return (
    <div className="cd" ref={box} style={{ "--c": t.src.c }}>
      <header className="cd-hd">
        <span className="cd-title"><i aria-hidden="true" />{t.src.label}{t.card?.live && <i className="live-dot" title="Live" />}</span>
        <span className="cd-links">
          {links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.text} ↗</a>)}
        </span>
      </header>
      {t.card?.staleAt && <p className="stale-note">Couldn't refresh · showing {t.card.staleAt}</p>}

      {accts.length > 1 && (
        <div className="cd-accts" role="tablist" aria-label={`${t.src.label} accounts`}>
          {accts.map((a, i) => (
            <button key={a.user} role="tab" aria-selected={i === k} className={i === k ? "on" : ""} onClick={() => (haptic(5), setK(i))}>
              {i === k && <motion.span className="cd-pill" layoutId={`acct-${t.id}`} transition={SPRING} />}
              <span>@{a.user}</span>
              <b>{nf(a.raw?.solved ?? 0)}</b>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={acct?.user || t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }} transition={SPRING}>
          {profile ? (
            <Profile p={profile} />
          ) : t.card ? (
            // live details unavailable: the saved numbers from data.js
            <div className="pf-card cd-saved">
              <b>{nf(t.card.val)}+</b> <span>{t.card.lbl}</span>
              <dl className="pf-facts">{t.card.meta.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
            </div>
          ) : null}
          {g ? (
            <Activity
              g={g} src={t.src} fit={fit}
              title={`${nf(g.total)} ${t.src.unit} in the past year`}
              label={`${t.src.label}${acct ? ` @${acct.user}` : ""}: ${nf(g.total)} ${t.src.unit} on ${g.active} days in the last year`}
              note={accts.length > 1 ? `@${acct.user}` : ""}
            />
          ) : (
            <p className="heat-empty">The activity map couldn't load right now.</p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// "All platforms": every platform's activity added together, plus a table to jump into any of them.
function Overview({ tiles, stats, onChoose, onClose }) {
  const box = useRef(null);
  const [fit, setFit] = useState({ cell: 12, weeks: WEEKS });
  useEffect(() => {
    const el = box.current;
    const ro = new ResizeObserver(() => setFit(fitGrid(el.clientWidth)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const per = useMemo(() => tiles.map((t) => {
    const d = t.src.get(stats);
    return { t, d, g: d ? grid(d) : null };
  }), [stats]); // tiles are rebuilt on every render but only change when stats do
  const loaded = per.filter((x) => x.d);
  const g = useMemo(() => grid(loaded.length ? mergeDays(loaded.map((x) => x.d)) : sample()), [per]);

  return (
    <div className="cd" ref={box} style={{ "--c": ALL.c }}>
      <header className="cd-hd">
        <span className="cd-title"><i aria-hidden="true" />All platforms{!loaded.length && " (sample)"}</span>
      </header>
      {loaded.length > 0 && (
        <div className="heat-table-wrap">
          <table className="heat-table">
            <thead>
              <tr><th scope="col">Platform</th><th scope="col">Past year</th><th scope="col">Active days</th><th scope="col">Longest streak</th><th scope="col">Current streak</th></tr>
            </thead>
            <tbody>
              {per.map(({ t, g: pg }) => (
                <tr key={t.id} style={{ "--c": t.src.c }}>
                  <th scope="row"><button onClick={() => onChoose(t.id)}><i aria-hidden="true" />{t.src.label}</button></th>
                  {pg && !pg.active ? (
                    <td colSpan={4} className="na">no activity in the last 12 months{pg.lastActive ? ` · last active ${pg.lastActive}` : ""}</td>
                  ) : pg ? (
                    <>
                      <td data-label="past year">{nf(pg.total)} <small>{t.src.unit}</small></td>
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
      <Activity g={g} src={ALL} fit={fit} title={`${nf(g.total)} activities in the past year`} label={`All platforms: ${nf(g.total)} activities on ${g.active} days in the last year`} note="All platforms added together" />
    </div>
  );
}

/*
  The platform page: a liquid-glass sheet that opens above the Coding page. Frosted, translucent layers over
  slowly drifting colour (the platform's own), with bright specular edges. On wide screens it grows out of the
  tile that was tapped; on phones it slides up and can be pulled down to close. Esc, ✕ or the backdrop close it.
*/
function Sheet({ from, color, label, onClose, children }) {
  const drag = useDragControls();
  const closeBtn = useRef(null);
  const phone = useRef(matchMedia("(max-width: 767px)").matches).current;
  useEffect(() => {
    stopScroll();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus({ preventScroll: true });
    const key = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", key);
    return () => {
      removeEventListener("keydown", key);
      document.body.style.overflow = prev;
      startScroll();
    };
  }, [onClose]);
  // grow from (and shrink back into) the tile that opened it
  const origin = from && !phone ? { x: from.x - innerWidth / 2, y: from.y - innerHeight / 2 } : { x: 0, y: 0 };
  const hidden = REDUCED ? { opacity: 0 } : phone ? { y: "100%" } : { opacity: 0, scale: 0.35, ...origin };
  const shown = REDUCED ? { opacity: 1 } : phone ? { y: 0 } : { opacity: 1, scale: 1, x: 0, y: 0 };

  return createPortal(
    <div className="lg-root" style={{ "--c": color }}>
      <motion.div className="lg-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={onClose}>
        {/* colour for the glass to bend: three soft blobs drifting behind the sheet */}
        <span className="lg-blob a" /><span className="lg-blob b" /><span className="lg-blob c" />
      </motion.div>
      <motion.article
        className="lg-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={hidden}
        animate={shown}
        exit={{ ...hidden, transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        drag={phone ? "y" : false}
        dragControls={drag}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => (info.offset.y > 120 || info.velocity.y > 700) && (haptic(), onClose())}
      >
        <span className="lg-shine" aria-hidden="true" />
        <div className="lg-grab" onPointerDown={(e) => phone && drag.start(e)}><span className="pd-handle" aria-hidden="true" /></div>
        <button className="lg-close" ref={closeBtn} onClick={onClose} aria-label={`Close ${label}`}><Icon name="x" size={18} /></button>
        <div className="lg-body" data-lenis-prevent>{children}</div>
      </motion.article>
    </div>,
    document.body
  );
}

/*
  Coding page, kept compact: one tile per platform with the number of problems solved (and the easy / medium /
  hard split where the platform gives one). Tap a tile and everything about that platform opens below the
  tiles: rank, solved by difficulty, badges, certificates and the activity map.
  Tap it again (or ✕) to close. #coding/leetcode opens a platform directly, so it can be linked.
*/
export default function Coding() {
  const stats = useStats();
  const platforms = livePlatforms(stats);
  const [open, setOpen] = useState(fromHash);
  const [from, setFrom] = useState(null); // where the tapped tile is, so the sheet can grow out of it
  const total = platforms.reduce((s, p) => s + p.val, 0);
  const updated = stats?.updated && new Date(stats.updated);

  const tiles = ORDER.map((id) => {
    const src = SOURCES.find((x) => x.id === id);
    const card = CARD[id] && platforms.find((p) => p.n === CARD[id]);
    const prof = stats && id !== "github" ? profileOf(id, stats) : null;
    const levels = id === "leetcode" ? profileOf(id, stats, stats?.leetcode?.accounts?.find((a) => a.user === stats.leetcode.top))?.solved.levels : prof?.solved?.levels;
    if (id === "github") return { id, src, val: stats?.github?.total ?? null, unit: "contributions this year" };
    if (!card) return null;
    return { id, src, card, val: card.val, unit: id === "hackerrank" ? "challenges solved" : "problems solved", levels, accounts: card.accounts?.length };
  }).filter((t) => t && t.val != null);

  const choose = (id, e) => {
    haptic(6);
    const next = open === id ? null : id;
    const r = e?.currentTarget?.getBoundingClientRect?.();
    if (r) setFrom({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    setOpen(next);
    history.replaceState(null, "", next ? `#coding/${next}` : "#coding");
  };
  const close = useCallback(() => {
    setOpen(null);
    history.replaceState(null, "", "#coding");
  }, []);
  const current = open === "all" ? "all" : tiles.find((t) => t.id === open);

  return (
    <>
      <Glitch text="Coding" />
      <button className={`ct-total ${open === "all" ? "on" : ""}`} onClick={(e) => choose("all", e)} aria-haspopup="dialog">
        <span className="lead-line"><b><Odometer value={total} suffix="+" /></b> problems solved across {platforms.length} platforms</span>
        <small>{open === "all" ? "Hide" : "See"} all activity <Icon name="chevron" size={14} /></small>
      </button>
      <a className="ct-contests" href="#contests"><Icon name="award" size={16} /><span>Contest ratings across platforms</span><Icon name="arrow" size={14} /></a>

      <ul className="ct-grid" aria-label="Coding platforms">
        {tiles.map((t, i) => (
          <Reveal as="li" key={t.id} delay={(i % 4) * 60}>
            <button className={`ct ${open === t.id ? "on" : ""}`} style={{ "--c": t.src.c }} onClick={(e) => choose(t.id, e)} aria-haspopup="dialog">
              {open === t.id && <motion.span className="ct-ring" layoutId="ct-ring" transition={SPRING} />}
              <span className="ct-name"><i aria-hidden="true" />{t.src.short === "GFG" ? "GeeksforGeeks" : t.src.label}{t.card?.live && <i className="live-dot" title="Live" />}</span>
              <span className="ct-val"><Odometer value={t.val} suffix={t.id === "github" ? "" : "+"} /></span>
              <span className="ct-unit">{t.unit}{t.accounts > 1 ? ` · best of ${t.accounts}` : ""}</span>
              <MiniLevels levels={t.levels} />
              <span className="ct-open" aria-hidden="true">{open === t.id ? "Close" : "Details"} <Icon name="chevron" size={13} /></span>
            </button>
          </Reveal>
        ))}
      </ul>

      <p className="ct-hint">Tap a platform to open its full profile: rank, difficulty split, badges, certificates and activity map.</p>

      <AnimatePresence>
        {current && (
          <Sheet key="sheet" from={from} color={current === "all" ? ALL.c : current.src.c} label={current === "all" ? "All platforms" : current.src.label} onClose={close}>
            {!stats ? (
              <div className="heat-skel" aria-busy="true" aria-label="Loading" />
            ) : current === "all" ? (
              <Overview key="all" tiles={tiles} stats={stats} onChoose={(id) => setOpen(id)} onClose={close} />
            ) : (
              <Detail key={current.id} t={current} stats={stats} onClose={close} />
            )}
          </Sheet>
        )}
      </AnimatePresence>

      <p className="note">
        {updated
          ? `// Live from LeetCode, GFG, GitHub, Code360, HackerRank, HackerEarth, NeetCode and InterviewBit · refreshed ${updated.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`
          : "// Saved stats from public profiles. Live numbers load on the deployed site."}
      </p>
    </>
  );
}
