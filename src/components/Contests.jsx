import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { SPRING, haptic } from "../hooks/spring";
import useStats from "../hooks/useStats";
import useContent from "../hooks/useContent";
import Glitch from "./Glitch";
import Reveal from "./Reveal";
import Odometer from "./Odometer";
import Icon from "./Icons";
import { RatingLine, TopBars } from "./Profile";

/*
  Contests: every rated contest across platforms in one place (laid out like a Codolio contest section):
  how many contests on each platform, the rating graph per platform, a ranking card per platform (rating,
  best rating, rank, level, where the rating sits among everyone) and the full contest history.
  Only platforms with rated contests on my profiles appear. LeetCode and Code360 are live from /api/stats;
  contests added in the admin page (MongoDB, /api/content) join them: on their own platform card for a
  platform without a live API (e.g. CodeChef), or in the history of LeetCode / Code360.
*/
const fmt = (n) => Number(n).toLocaleString("en-IN");
const day = (t) => new Date(t * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Platforms that run rated contests, and how to read each one's contest data from the stats response.
const PLATFORMS = [
  {
    id: "leetcode", name: "LeetCode", c: "#ffa116", start: 1500,
    read: (s) => {
      const a = s?.leetcode?.accounts?.find((x) => x.contest?.history?.length);
      const c = a?.contest;
      if (!c) return null;
      return {
        url: a.url, handle: a.user, rating: c.rating, max: Math.max(...c.history.map((h) => h.r)), attended: c.attended, history: c.history,
        facts: [["Global ranking", `${fmt(c.ranking)} / ${fmt(c.of)}`], ["Top", `${c.top}%`]],
        bars: (s.leetcode.histogram || []).filter((b) => b.n > 0).map((b) => ({ n: b.n, me: c.rating >= b.from && c.rating < b.to, title: `${fmt(b.from)}–${fmt(b.to)} rating`, sub: `${fmt(b.n)} users · top ${b.top}%` })),
      };
    },
  },
  {
    id: "code360", name: "Code360", c: "#f05b5b", start: null,
    read: (s) => {
      const c = s?.code360?.contest;
      if (!c) return null;
      return {
        url: "https://www.naukri.com/code360/profile/guruprasadgp", handle: "guruprasadgp", rating: c.rating, max: c.max, attended: c.attended, history: c.history,
        level: c.group, icon: c.icon,
        facts: c.group ? [["Level", c.group]] : [],
        bars: (c.hist || []).map((b) => ({ n: b.n, me: c.rating >= b.from && c.rating < b.to, title: `${fmt(b.from)}–${fmt(b.to)} rating`, sub: `${fmt(b.n)} users` })),
      };
    },
  },
  {
    id: "codeforces", name: "Codeforces", c: "#3b8fd9", start: null,
    read: (s) => {
      const c = s?.codeforces?.contest;
      if (!c) return null; // shows up after the first rated contest
      return {
        url: s.codeforces.url, handle: s.codeforces.user, rating: c.rating, max: c.max, attended: c.attended, history: c.history,
        facts: c.rank ? [["Rank", c.rank.replace(/^./, (x) => x.toUpperCase())]] : [],
        bars: [],
      };
    },
  },
];

// Colours for platforms that only have contests added by hand; anything else gets the neutral one.
const MANUAL_COLORS = { codechef: "#b9875f", codeforces: "#3b8fd9", atcoder: "#9aa3ad", hackerrank: "#1fb85c", hackerearth: "#5b7cfa", gfg: "#2f9e57", geeksforgeeks: "#2f9e57" };
const keyOf = (name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, "");
const toRow = (c) => ({ t: Date.parse(c.date) / 1000, r: c.rating ?? null, name: c.name, rank: c.rank ?? null, players: c.players ?? null, solved: c.solved ?? null, of: c.of ?? null, url: c.url || null, manual: true });

// Live platforms plus the hand-added contests, grouped by platform.
function withManual(live, manual) {
  const groups = new Map();
  for (const c of manual || []) {
    const k = keyOf(c.platform);
    if (!groups.has(k)) groups.set(k, { name: c.platform, rows: [] });
    groups.get(k).rows.push(toRow(c));
  }
  const out = live.map((p) => {
    const extra = groups.get(p.id)?.rows || [];
    groups.delete(p.id);
    const known = new Set(p.d.history.map((h) => h.name.toLowerCase()));
    const add = extra.filter((h) => !known.has(h.name.toLowerCase()));
    return add.length ? { ...p, d: { ...p.d, attended: p.d.attended + add.length, history: [...p.d.history, ...add].sort((a, b) => a.t - b.t) } } : p;
  });
  for (const [k, g] of groups) {
    const history = g.rows.sort((a, b) => a.t - b.t);
    const rated = history.filter((h) => h.r != null);
    out.push({
      id: k, name: g.name, c: MANUAL_COLORS[k] || "#8b8fa3", start: null,
      d: { rating: rated.at(-1)?.r ?? null, max: rated.length ? Math.max(...rated.map((h) => h.r)) : null, attended: history.length, history, facts: [], bars: [] },
    });
  }
  return out;
}

export default function Contests() {
  const stats = useStats();
  const content = useContent();
  const list = useMemo(() => withManual(PLATFORMS.map((p) => ({ ...p, d: p.read(stats) })).filter((p) => p.d), content?.contests), [stats, content]);
  const [pick, setPick] = useState(null);
  const cur = list.find((p) => p.id === pick) || list[0];
  const total = list.reduce((t, p) => t + p.d.attended, 0);
  const best = list.reduce((m, p) => Math.max(m, p.d.max ?? 0), 0);

  // every contest from every platform, newest first, with the rating change it caused
  const rows = useMemo(() => list.flatMap((p) => p.d.history.map((h, i) => {
    // change from the previous rated contest on the same platform (or the starting rating)
    const before = p.d.history.slice(0, i).reverse().find((x) => x.r != null)?.r ?? p.start;
    return { ...h, p, delta: before != null && h.r != null ? h.r - before : null };
  })).sort((a, b) => b.t - a.t), [list]);

  if (!stats && !content?.contests?.length) return (<><Glitch text="Contests" /><div className="heat-skel" aria-busy="true" aria-label="Loading contest ratings" /></>);
  if (!list.length) return (<><Glitch text="Contests" /><p className="lead-line">Live contest ratings couldn't load right now. They're on my <a href="https://leetcode.com/u/guruprasadgp22/" target="_blank" rel="noopener noreferrer">LeetCode</a> and <a href="https://www.naukri.com/code360/profile/guruprasadgp" target="_blank" rel="noopener noreferrer">Code360</a> profiles.</p></>);

  const last = cur.d.history.at(-1);
  return (
    <>
      <Glitch text="Contests" />
      <p className="lead-line">
        <b><Odometer value={total} /></b> rated contests across {list.length} platforms · best rating <b>{fmt(best)}</b>
      </p>

      <div className="cx-top">
        {/* how many contests on each platform */}
        <Reveal className="cx-card cx-attended">
          <h4 className="cx-h">Contests attended</h4>
          <b className="cx-big">{total}</b>
          <ul className="cx-split">
            {list.map((p) => (
              <li key={p.id} style={{ "--c": p.c }}>
                <span><i aria-hidden="true" />{p.name}</span>
                <b>{p.d.attended}</b>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* rating over time, one platform at a time */}
        <Reveal className="cx-card cx-graph" delay={80} style={{ "--c": cur.c }}>
          <div className="cx-graph-hd">
            <div>
              <small>Rating</small>
              <b className="cx-rating">{cur.d.rating != null ? fmt(cur.d.rating) : "Unrated"}</b>
            </div>
            <div className="cx-last">
              <small>{day(last.t)}</small>
              <b>{last.name}</b>
              {last.rank && <small>Rank {fmt(last.rank)}{last.players ? ` of ${fmt(last.players)}` : ""}</small>}
            </div>
          </div>
          {list.length > 1 && (
            <div className="cx-tabs" role="tablist" aria-label="Rating graph platform">
              {list.map((p) => (
                <button key={p.id} role="tab" aria-selected={p === cur} className={p === cur ? "on" : ""} style={{ "--c": p.c }} onClick={() => (haptic(5), setPick(p.id))}>
                  {p === cur && <motion.span className="cx-pill" layoutId="cx-pill" transition={SPRING} />}
                  <i aria-hidden="true" />{p.name}
                </button>
              ))}
            </div>
          )}
          {cur.d.history.filter((h) => h.r != null).length > 1 ? <RatingLine key={cur.id} history={cur.d.history.filter((h) => h.r != null)} /> : <p className="cx-one">{cur.d.history.some((h) => h.r != null) ? "One rated contest so far." : "No rated contests yet."}</p>}
        </Reveal>
      </div>

      <h3 className="h3 cx-sec">Contest rankings</h3>
      <div className="cx-ranks">
        {list.map((p, k) => (
          <Reveal className="cx-card cx-rank" key={p.id} delay={k * 80} style={{ "--c": p.c }}>
            <header>
              <span className="cx-name"><i aria-hidden="true" />{p.name}</span>
              {p.d.handle && <a href={p.d.url} target="_blank" rel="noopener noreferrer">@{p.d.handle} <Icon name="arrow" size={13} /></a>}
            </header>
            <div className="cx-rank-main">
              {p.d.icon && <img src={p.d.icon} alt="" aria-hidden="true" width="44" height="44" />}
              <b>{p.d.rating != null ? fmt(p.d.rating) : "–"}</b>
              {p.d.max != null && <small>(max: {fmt(p.d.max)})</small>}
            </div>
            <dl className="pf-facts">
              <div><dt>Contests</dt><dd>{p.d.attended}</dd></div>
              {p.d.facts.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}
            </dl>
            {p.d.bars.length > 0 && (
              <div className="cx-dist">
                <small>Where this rating sits among everyone on {p.name}</small>
                <TopBars bars={p.d.bars} label={`${p.name} rating distribution, ${fmt(p.d.rating)} highlighted`} />
              </div>
            )}
          </Reveal>
        ))}
      </div>

      <h3 className="h3 cx-sec">Contest history</h3>
      <Reveal className="cx-card cx-table-wrap">
        <table className="cx-table">
          <thead>
            <tr><th scope="col">Date</th><th scope="col">Contest</th><th scope="col">Rank</th><th scope="col">Solved</th><th scope="col">Rating</th></tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.p.id + h.t + h.name} style={{ "--c": h.p.c }}>
                <td data-label="Date">{day(h.t)}</td>
                <th scope="row" data-label="Contest"><i aria-hidden="true" />{h.url ? <a href={h.url} target="_blank" rel="noopener noreferrer">{h.name}</a> : h.name}<small>{h.p.name}</small></th>
                <td data-label="Rank">{h.rank ? <>{fmt(h.rank)}{h.players ? <small> / {fmt(h.players)}</small> : null}</> : "–"}</td>
                <td data-label="Solved">{h.solved != null ? `${h.solved}${h.of ? `/${h.of}` : ""}` : "–"}</td>
                <td data-label="Rating">
                  <b>{h.r != null ? fmt(h.r) : "–"}</b>
                  {h.delta != null && h.delta !== 0 && <span className={`cx-delta ${h.delta > 0 ? "up" : "down"}`}>{h.delta > 0 ? "▲" : "▼"} {Math.abs(h.delta)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
      <p className="note">
        // Live from {PLATFORMS.filter((x) => list.some((p) => p.id === x.id)).map((x) => x.name).join(", ").replace(/, ([^,]*)$/, " and $1") || "LeetCode and Code360"}{list.some((p) => !PLATFORMS.find((x) => x.id === p.id)) ? `; ${list.filter((p) => !PLATFORMS.find((x) => x.id === p.id)).map((p) => p.name).join(", ")} added by hand` : ""}.
        {(() => {
          const none = [["gfg", "GeeksforGeeks"], ["hackerrank", "HackerRank"], ["neetcode", "NeetCode"], ["interviewbit", "InterviewBit"], ["hackerearth", "HackerEarth"], ["codeforces", "Codeforces"]].filter(([k]) => !list.some((p) => p.id === k)).map(([, n]) => n);
          return none.length ? ` ${none.join(", ").replace(/, ([^,]*)$/, " and $1")} ${none.length > 1 ? "have" : "has"} no rated contests on my profiles yet.` : "";
        })()}
      </p>
    </>
  );
}
