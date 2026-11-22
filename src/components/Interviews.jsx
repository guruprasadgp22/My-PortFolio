import { useEffect, useMemo, useState } from "react";
import { INTERVIEWS } from "../data";
import Glitch from "./Glitch";
import Icon from "./Icons";
import Reveal from "./Reveal";

/*
  Interviews tab: interview experiences, so people preparing for the same company can read how it went.
  The content comes from Pages → Interview experiences in the admin page (INTERVIEWS in data.js).
  Newest first; filter by result, search by company, role or topic. "#interviews/zoho-software-developer"
  opens that interview straight away.
*/
const clean = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === "string" && x.trim()) : []);
const slug = (x) => `${x.company || ""}-${x.role || x.title || ""}-${x.date || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const day = (d) => {
  const t = Date.parse(d);
  return Number.isNaN(t) ? d : new Date(t).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" });
};
const RESULT = { Selected: "good", Rejected: "bad", Pending: "wait", Withdrew: "mute", "No response": "mute" };

// plain text with any https:// link turned into a real link
function Text({ children, as: Tag = "p", className }) {
  const parts = String(children || "").split(/(https?:\/\/[^\s)]+)/g);
  return (
    <Tag className={className}>
      {parts.map((p, i) => (i % 2 ? <a key={i} href={p} target="_blank" rel="noopener noreferrer">{p.replace(/^https?:\/\/(www\.)?/, "").slice(0, 48)}</a> : p))}
    </Tag>
  );
}

function Interview({ x, open, toggle }) {
  const rounds = (Array.isArray(x.rounds) ? x.rounds : []).filter((r) => r && (r.name || r.type || r.d || clean(r.questions).length));
  const topics = clean(x.topics), tips = clean(x.tips);
  const facts = [
    ["Designation", x.role], ["Mode", x.mode], ["Location", x.location], ["Applied via", x.source],
    ["Experience", x.level], ["Difficulty", x.difficulty], ["Process", x.duration], ["CTC", x.ctc],
  ].filter(([, v]) => v);
  return (
    <article className={`cx-card iv ${open ? "open" : ""}`} id={`iv-${x.id}`}>
      <button className="iv-hd" onClick={toggle} aria-expanded={open} aria-controls={`iv-body-${x.id}`}>
        <span className="iv-co" aria-hidden="true">{(x.company || x.title || "?").trim()[0]?.toUpperCase()}</span>
        <span className="iv-hd-main">
          <span className="iv-meta">{[x.company, x.date && day(x.date), rounds.length ? `${rounds.length} round${rounds.length > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ")}</span>
          <h3 className="h4 iv-title">{x.title || `${x.role || "Interview"} at ${x.company || "…"}`}</h3>
          <span className="iv-chips">
            {x.result && <span className={`iv-res ${RESULT[x.result] || "mute"}`}>{x.result}</span>}
            {x.mode && <span className="tag">{x.mode}</span>}
            {x.difficulty && <span className={`tag iv-diff ${x.difficulty.toLowerCase()}`}>{x.difficulty}</span>}
          </span>
        </span>
        <Icon name="chevron" size={18} />
      </button>

      {open && (
        <div className="iv-body" id={`iv-body-${x.id}`}>
          {facts.length > 0 && (
            <dl className="iv-facts">
              {facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
            </dl>
          )}
          {x.summary && <Text className="iv-sum">{x.summary}</Text>}

          {rounds.length > 0 && (
            <>
              <h4 className="iv-sec">Rounds</h4>
              <ol className="iv-rounds">
                {rounds.map((r, i) => (
                  <li key={i}>
                    <span className="iv-dot" aria-hidden="true">{i + 1}</span>
                    <div>
                      <h5>{r.name || r.type || `Round ${i + 1}`}</h5>
                      <p className="iv-rmeta">
                        {[r.name && r.type, r.mode, r.duration].filter(Boolean).join(" · ")}
                        {r.result && <span className={`iv-res sm ${r.result === "Cleared" ? "good" : r.result === "Not cleared" ? "bad" : "mute"}`}>{r.result}</span>}
                      </p>
                      {r.d && <Text className="iv-sum">{r.d}</Text>}
                      {clean(r.questions).length > 0 && (
                        <ul className="iv-qs" aria-label="Questions asked">
                          {clean(r.questions).map((q, j) => <Text as="li" key={j}>{q}</Text>)}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}

          {topics.length > 0 && (
            <>
              <h4 className="iv-sec">Topics asked</h4>
              <div className="stack">{topics.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
            </>
          )}
          {tips.length > 0 && (
            <>
              <h4 className="iv-sec">Tips if you're interviewing there</h4>
              <ul className="iv-tips">{tips.map((t, j) => <Text as="li" key={j}>{t}</Text>)}</ul>
            </>
          )}
          {/^https:\/\//.test(x.url || "") && (
            <a className="iv-link" href={x.url} target="_blank" rel="noopener noreferrer">Read it on {new URL(x.url).hostname.replace(/^www\./, "")} <Icon name="arrow" size={13} /></a>
          )}
        </div>
      )}
    </article>
  );
}

export default function Interviews() {
  const list = useMemo(() => {
    const seen = new Map();
    return (Array.isArray(INTERVIEWS) ? INTERVIEWS : [])
      .filter((x) => x && typeof x === "object" && !x.hidden && (x.title || x.company))
      .map((x, i) => {
        // two interviews at the same company, role and date still get their own link
        let id = slug(x) || `interview-${i + 1}`;
        seen.set(id, (seen.get(id) || 0) + 1);
        if (seen.get(id) > 1) id += `-${seen.get(id)}`;
        return { ...x, id, i };
      })
      .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0) || a.i - b.i);
  }, [INTERVIEWS]);

  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(() => new Set([location.hash.split("/")[1]].filter(Boolean)));
  // a shared link opens that interview and scrolls to it
  useEffect(() => {
    const id = location.hash.split("/")[1];
    if (id) requestAnimationFrame(() => document.getElementById(`iv-${id}`)?.scrollIntoView({ block: "start" }));
  }, []);
  const toggle = (id) => {
    const next = new Set(open);
    next.has(id) ? next.delete(id) : next.add(id);
    setOpen(next);
    history.replaceState(null, "", next.has(id) ? `#interviews/${id}` : "#interviews");
  };

  const results = ["All", ...Object.keys(RESULT).filter((r) => list.some((x) => x.result === r))];
  const words = q.trim().toLowerCase();
  const shown = list.filter((x) => (filter === "All" || x.result === filter) &&
    (!words || [x.title, x.company, x.role, x.location, x.mode, ...clean(x.topics)].join(" ").toLowerCase().includes(words)));
  const companies = new Set(list.map((x) => (x.company || "").trim().toLowerCase()).filter(Boolean)).size;
  const rounds = list.reduce((n, x) => n + (Array.isArray(x.rounds) ? x.rounds.length : 0), 0);
  const offers = list.filter((x) => x.result === "Selected").length;

  return (
    <>
      <Glitch text="Interviews" />
      <p className="iv-lede">How my interviews went, round by round: the questions, what worked and what I'd do differently. Written for anyone preparing for the same companies.</p>

      {!list.length ? (
        <Reveal className="cx-card iv-empty">
          <Icon name="chat" size={28} />
          <p>Interview experiences are on their way. Check back soon.</p>
        </Reveal>
      ) : (
        <>
          <dl className="iv-stats">
            <div><dt>Interviews</dt><dd>{list.length}</dd></div>
            <div><dt>Companies</dt><dd>{companies}</dd></div>
            <div><dt>Rounds</dt><dd>{rounds}</dd></div>
            <div title="Interviews written up on this page that ended in an offer"><dt>Selected</dt><dd>{offers}</dd></div>
          </dl>

          <div className="iv-tools">
            {results.length > 2 && (
              <div className="cx-tabs" role="group" aria-label="Filter by result">
                {results.map((r) => (
                  <button key={r} className={filter === r ? "on" : ""} aria-pressed={filter === r} onClick={() => setFilter(r)} style={{ "--c": "var(--ember)" }}>
                    {filter === r && <span className="cx-pill" />}{r}
                  </button>
                ))}
              </div>
            )}
            {list.length > 3 && (
              <label className="iv-search">
                <Icon name="search" size={15} />
                <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Company, role or topic" aria-label="Search interviews" />
              </label>
            )}
          </div>

          <div className="iv-list">
            {shown.map((x) => <Interview key={x.id} x={x} open={open.has(x.id)} toggle={() => toggle(x.id)} />)}
            {!shown.length && <p className="note">// Nothing matches that. Try another word or filter.</p>}
          </div>
        </>
      )}
    </>
  );
}
