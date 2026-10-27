import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { REDUCED } from "../hooks/motion";
import useInView from "../hooks/useInView";

/*
  LeetCode-style profile panel for one coding platform (data shape: src/profiles.js):
  a "Top x%" ranking card where the platform has one, a solved ring split by difficulty with
  per-difficulty chips, and a side card (badges, skill stars, topics or facts). Every chart has a hover
  tooltip, and every number is also written out as text, so nothing relies on colour alone.
*/
const fmt = (n) => Number(n).toLocaleString("en-IN");
const month = (t) => new Date(t * 1000).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
const day = (t) => new Date(t * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Tooltip rendered on <body>, so the carousel's clipping and transforms can't hide or shift it.
function useTip() {
  const [tip, setTip] = useState(null);
  useEffect(() => {
    if (!tip) return;
    const hide = () => setTip(null);
    addEventListener("scroll", hide, { passive: true, once: true, capture: true }); // any scroller, not just the window
    return () => removeEventListener("scroll", hide, { capture: true });
  }, [tip]);
  const node = createPortal(
    <AnimatePresence>
      {tip && (
        <motion.div className="heat-tip" style={{ left: Math.min(Math.max(tip.x, 120), innerWidth - 120), top: tip.y }} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
          {tip.body}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
  return [setTip, node];
}

// Contest rating over time (used by the Contests page): a 2px line, the latest point marked, crosshair + tooltip on hover.
export function RatingLine({ history }) {
  const [setTip, tipNode] = useTip();
  const [hover, setHover] = useState(null);
  // drawn at its real pixel width (not stretched), so the dots stay round on every screen
  const box = useRef(null);
  const [W, setW] = useState(520);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.round(e.contentRect.width))));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const H = 130, P = { l: 6, r: 8, t: 12, b: 8 };
  const pts = useMemo(() => {
    const ts = history.map((h) => h.t), rs = history.map((h) => h.r);
    const t0 = Math.min(...ts), t1 = Math.max(...ts), lo = Math.min(...rs) - 20, hi = Math.max(...rs) + 20;
    return history.map((h) => ({
      ...h,
      x: P.l + (t1 === t0 ? 0.5 : (h.t - t0) / (t1 - t0)) * (W - P.l - P.r),
      y: P.t + (1 - (h.r - lo) / (hi - lo || 1)) * (H - P.t - P.b),
    }));
  }, [history, W]);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = pts.at(-1);

  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const p = pts.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    setHover(p);
    setTip({ x: r.left + (p.x / W) * r.width, y: r.top + (p.y / H) * r.height - 6, body: <><b>{fmt(p.r)}</b> · {p.name}<br /><small>{day(p.t)}{p.rank ? ` · rank ${fmt(p.rank)}` : ""}</small></> });
  };
  const leave = () => (setHover(null), setTip(null));

  return (
    <figure className="pf-line" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} onPointerMove={move} onPointerLeave={leave} role="img" aria-label={`Contest rating from ${fmt(history[0].r)} to ${fmt(last.r)} over ${history.length} contests`}>
        <line x1={P.l} x2={W - P.r} y1={H - P.b} y2={H - P.b} className="pf-axis" />
        {hover && <line x1={hover.x} x2={hover.x} y1={P.t - 6} y2={H - P.b} className="pf-cross" />}
        <motion.path d={path} className="pf-path" initial={{ pathLength: REDUCED ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: REDUCED ? 0 : 1.1, ease: [0.65, 0, 0.35, 1] }} />
        {pts.map((p) => <circle key={p.t} cx={p.x} cy={p.y} r={hover === p ? 5 : 2.5} className={`pf-dot ${hover === p ? "on" : ""}`} />)}
        <circle cx={last.x} cy={last.y} r="5" className="pf-dot on" />
      </svg>
      <figcaption className="pf-axis-lbl"><span>{month(history[0].t)}</span><span>{month(last.t)}</span></figcaption>
      {tipNode}
      {/* the same numbers as a table, for screen readers */}
      <table className="sr-only">
        <caption>Contest rating history</caption>
        <thead><tr><th>Contest</th><th>Date</th><th>Rating</th></tr></thead>
        <tbody>{history.map((h) => <tr key={h.t}><td>{h.name}</td><td>{day(h.t)}</td><td>{h.r}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

// "Top x%": the distribution as bars, with the bucket this profile falls in highlighted.
export function TopBars({ bars, label }) {
  const [setTip, tipNode] = useTip();
  const max = Math.max(...bars.map((b) => b.n));
  return (
    <div className="pf-bars" role="img" aria-label={label}>
      {bars.map((b, i) => (
        <span
          key={i}
          className={`pf-bar ${b.me ? "me" : ""}`}
          style={{ "--h": `${Math.max(4, (b.n / max) * 100)}%`, "--i": i }}
          onPointerEnter={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setTip({ x: r.left + r.width / 2, y: r.top - 4, body: <><b>{b.title}</b><br /><small>{b.sub}</small></> });
          }}
          onPointerLeave={() => setTip(null)}
        />
      ))}
      {tipNode}
    </div>
  );
}

function Ranking({ r }) {
  const bars = r.buckets.map((b) => ({ n: b.n, me: b.me, title: `${b.label} ${r.unit}`, sub: `${fmt(b.n)} users · ${b.pct}%` }));
  return (
    <section className="pf-card pf-contest pf-ranking">
      <dl className="pf-kpis">
        <div><dt>Top</dt><dd className="big">{r.top}%</dd></div>
        {r.users && <div><dt>Active users</dt><dd>{fmt(r.users)}</dd></div>}
      </dl>
      <div className="pf-ranking-chart">
        <TopBars bars={bars} label={`Top ${r.top}% of users by ${r.unit}`} />
        <div className="pf-bars-lbl">{r.buckets.map((b) => <span key={b.label}>{b.label}</span>)}</div>
      </div>
    </section>
  );
}

// Solved ring: one arc per difficulty. With known totals, each arc's length is that difficulty's share of all
// problems and it fills by how many you've solved (like LeetCode); without totals, the arcs split what you solved.
function Solved({ s }) {
  const ref = useRef(null);
  const seen = useInView(ref, 0.3) || REDUCED;
  const [hl, setHl] = useState(null);
  const levels = s.levels.filter((l) => l.n > 0 || l.of);
  const withTotals = levels.length > 0 && levels.every((l) => l.of);
  const base = withTotals ? levels.reduce((t, l) => t + l.of, 0) : levels.reduce((t, l) => t + l.n, 0);
  const R = 70, C = 2 * Math.PI * R, SWEEP = 0.75, GAP = levels.length > 1 ? 0.012 : 0;
  let at = 0;
  const arcs = levels.map((l) => {
    const share = (withTotals ? l.of : l.n) / (base || 1);
    const len = Math.max(0, share * SWEEP - GAP);
    const arc = { ...l, start: at, len, fill: withTotals ? len * (l.n / l.of) : len };
    at += share * SWEEP;
    return arc;
  });
  const cur = hl && arcs.find((a) => a.k === hl);

  return (
    <section className="pf-card pf-solved" ref={ref}>
      <div className="pf-ring" onPointerLeave={() => setHl(null)}>
        <svg viewBox="0 0 180 180" role="img" aria-label={`${fmt(s.n)}${s.of ? ` of ${fmt(s.of)}` : ""} ${s.unit || "problems"} solved${levels.length ? `: ${levels.map((l) => `${l.k} ${l.n}${l.of ? ` of ${l.of}` : ""}`).join(", ")}` : ""}`}>
          <g transform="rotate(135 90 90)">
            {arcs.length ? (
              arcs.map((a) => (
                <g key={a.k} className={`pf-arc lv-${a.c} ${hl && hl !== a.k ? "dim" : ""}`} onPointerEnter={() => setHl(a.k)}>
                  <circle cx="90" cy="90" r={R} className="track" strokeDasharray={`${a.len * C} ${C}`} strokeDashoffset={-a.start * C} />
                  <circle cx="90" cy="90" r={R} className="fill" strokeDasharray={`${seen ? a.fill * C : 0} ${C}`} strokeDashoffset={-a.start * C} />
                </g>
              ))
            ) : (
              <circle cx="90" cy="90" r={R} className="pf-arc-solo" strokeDasharray={`${seen ? SWEEP * C : 0} ${C}`} />
            )}
          </g>
        </svg>
        <div className="pf-ring-c" aria-hidden="true">
          {cur ? (
            <>
              <b>{cur.of ? `${((cur.n / cur.of) * 100).toFixed(1)}%` : fmt(cur.n)}</b>
              <span>{cur.k}{cur.of ? ` · ${fmt(cur.n)}/${fmt(cur.of)}` : ""}</span>
            </>
          ) : (
            <>
              <b>{fmt(s.n)}{s.of && <small>/{fmt(s.of)}</small>}</b>
              <span className="ok">✓ Solved</span>
              {s.attempting > 0 && <small className="att">{s.attempting} attempting</small>}
            </>
          )}
        </div>
      </div>
      {levels.length > 0 ? (
        <ul className="pf-levels">
          {levels.map((l) => (
            <li key={l.k}>
              <button className={`pf-lv lv-${l.c} ${hl === l.k ? "on" : ""}`} onPointerEnter={() => setHl(l.k)} onPointerLeave={() => setHl(null)} onFocus={() => setHl(l.k)} onBlur={() => setHl(null)}>
                <span className="k"><i aria-hidden="true" />{l.k}</span>
                <b>{fmt(l.n)}{l.of && <small>/{fmt(l.of)}</small>}</b>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pf-nolv">{s.unit === "challenges" ? "HackerRank doesn't split challenges by difficulty; skill badges are on the right." : "This platform doesn't publish a difficulty split."}</p>
      )}
    </section>
  );
}

function Stars({ n }) {
  return <span className="pf-stars" aria-label={`${n} of 5 stars`}>{[1, 2, 3, 4, 5].map((k) => <i key={k} className={k <= n ? "on" : ""} aria-hidden="true">★</i>)}</span>;
}

function Side({ d }) {
  if (!d) return null;
  return (
    <section className="pf-card pf-side">
      <h5 className="pf-side-h">{d.title}{d.count != null && <b>{d.count}</b>}</h5>
      {d.kind === "badges" && (
        <>
          <ul className="pf-badges">
            {d.items.slice(0, 6).map((b, i) => (
              <li key={b.name} style={{ "--i": i }} title={`${b.name} · ${b.at}`}>
                <img src={b.icon} alt={b.name} loading="lazy" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.visibility = "hidden")} />
              </li>
            ))}
          </ul>
          {d.recent && <p className="pf-recent"><small>Most recent badge</small><b>{d.recent}</b></p>}
        </>
      )}
      {d.kind === "tags" && <div className="stack">{d.items.map((t) => <span className="tag" key={t}>{t}</span>)}</div>}
      {d.kind === "skills" && (
        <>
          <ul className="pf-skills">
            {d.skills.map((k) => <li key={k.name}><span>{k.name}<small>{k.solved} solved</small></span><Stars n={k.stars} /></li>)}
          </ul>
          {d.certs?.length > 0 && <p className="pf-recent"><small>Certificates</small><b>{d.certs.join(" · ")}</b></p>}
        </>
      )}
      {d.kind === "topics" && (
        <ul className="pf-topics">
          {d.topics.map((t) => (
            <li key={t.name}>
              <span>{t.name}<small>{t.solved} solved · {fmt(t.score)}/{fmt(t.of)}</small></span>
              <i aria-hidden="true"><i style={{ width: `${(t.score / (t.of || 1)) * 100}%` }} /></i>
            </li>
          ))}
        </ul>
      )}
      {d.facts?.length > 0 && (
        <dl className="pf-facts">
          {d.facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
      )}
    </section>
  );
}

export default function Profile({ p }) {
  if (!p) return null;
  return (
    <div className="pf">
      {p.ranking && <Ranking r={p.ranking} />}
      <div className={`pf-row ${p.side ? "" : "solo"}`}>
        {p.solved && <Solved s={p.solved} />}
        <Side d={p.side} />
      </div>
    </div>
  );
}
