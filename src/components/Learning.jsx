import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LEARNING } from "../data";
import { coursesFrom, GROUPS } from "../learning";
import { REDUCED } from "../hooks/motion";
import { SPRING, haptic } from "../hooks/spring";
import useContent from "../hooks/useContent";
import useLessons from "../hooks/useLessons";
import Glitch from "./Glitch";
import Reveal from "./Reveal";
import Icon from "./Icons";

/*
  Learning: what I'm studying right now and how far I've got. One card per course with its progress,
  topics, the next lesson to watch and the full lesson list. Progress is updated in the admin page (#admin,
  stored in MongoDB), falling back to data.js; lesson titles and lengths load from YouTube (useLessons),
  falling back to the snapshot in learning.json.
*/
const playlist = (id) => `https://www.youtube.com/playlist?list=${id}`;
const watch = (v, list) => `https://www.youtube.com/watch?v=${v}&list=${list}`;
// "1:04:09"-style lengths; a few videos report a few seconds (premieres), so those show no length
const len = (s) => (s < 60 ? "" : s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`);
const hours = (c) => {
  if (!c.lessons.length) return null;
  const h = c.lessons.reduce((t, l) => t + (l.s >= 60 ? l.s : 0), 0) / 3600;
  // only part of a long playlist is listed, so its total is a lower bound
  return `${h >= 10 ? Math.round(h) : h.toFixed(1)}${c.lessons.length < c.count ? "+" : ""} h`;
};

const finished = (t) => t.done != null && t.done >= t.count;
const unstarted = (t) => t.done === 0;

// short topic tags on the cards (the full name is in the tooltip)
const SHORT = { dsa: "DSA", ai: "AI & LLMs", other: "Other" };

// the three sections of the page, in this order; a course is in exactly one
const STAGES = [
  { id: "done", slug: "completed", title: "Completed", icon: "check", empty: "No course finished yet.", has: finished },
  { id: "now", slug: "ongoing", title: "Ongoing", icon: "zap", empty: "Nothing in progress right now.", has: (t) => !finished(t) && !unstarted(t) },
  { id: "next", slug: "upcoming", title: "Upcoming", icon: "book", empty: "Nothing queued up next.", has: unstarted },
];

function Course({ t, k, group }) {
  const done = finished(t);
  const pct = t.done != null ? Math.min(100, Math.round((t.done / t.count) * 100)) : null;
  const next = t.done != null && !done ? t.lessons[t.done] : null;
  return (
    <Reveal as="li" className={`cx-card ln-card ln-${t.group} ${done ? "done" : ""}`} delay={(k % 2) * 70}>
      <header className="ln-hd">
        <span className={`ln-status ${done ? "done" : unstarted(t) ? "next" : "now"}`}>
          {done ? <><Icon name="check" size={13} /> Completed</> : unstarted(t) ? "Up next" : <><i aria-hidden="true" /> In progress</>}
        </span>
        {group && <span className="ln-topic" title={group.title}>{SHORT[group.id] || group.title}</span>}
        <a className="ln-yt" href={playlist(t.list)} target="_blank" rel="noopener noreferrer" aria-label={`${t.title} playlist on YouTube`}>
          YouTube <Icon name="arrow" size={13} />
        </a>
      </header>
      <h4 className="ln-title">{t.title}</h4>
      {t.sub && <p className="ln-sub">{t.sub}</p>}

      <div className="ln-progress">
        <div className={`ln-bar ${pct == null ? "open" : ""}`} role="progressbar" aria-label={`${t.title} progress`}
          aria-valuemin={0} aria-valuemax={t.count} {...(pct != null ? { "aria-valuenow": t.done } : { "aria-valuetext": "In progress" })}>
          {pct != null && (
            <motion.i initial={REDUCED ? false : { width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }} />
          )}
        </div>
        <p className="ln-count">
          <span>{pct != null ? <><b>{t.done}</b> / {t.count} lessons · {pct}%</> : <>{t.count} lessons · watching now</>}</span>
          {hours(t) && <span>{hours(t)} of video</span>}
        </p>
      </div>

      <ul className="ln-focus" aria-label="Topics">
        {t.focus.map((f) => <li key={f} className="tag">{f}</li>)}
      </ul>

      {next && (
        <a className="ln-next" href={watch(next.v, t.list)} target="_blank" rel="noopener noreferrer">
          <small>{t.done ? `Next up · lesson ${t.done + 1}` : "Starting with"}</small>
          <span>{next.t}</span>
        </a>
      )}

      {t.lessons.length > 0 && <details className="ln-lessons">
        <summary>All {t.count} lessons <Icon name="chevron" size={14} /></summary>
        <ol>
          {t.lessons.map((l, i) => {
            const seen = t.done != null && i < t.done;
            return (
              <li key={l.v} className={seen ? "seen" : ""}>
                <span className="ln-n" aria-hidden="true">{seen ? <Icon name="check" size={12} /> : i + 1}</span>
                <a href={watch(l.v, t.list)} target="_blank" rel="noopener noreferrer">
                  {l.t}{l.lc ? <small> · LC {l.lc}</small> : null}
                  {seen && <span className="sr-only"> (done)</span>}
                </a>
                <time>{len(l.s)}</time>
              </li>
            );
          })}
        </ol>
        {t.lessons.length < t.count && (
          <a className="ln-more" href={playlist(t.list)} target="_blank" rel="noopener noreferrer">
            and {t.count - t.lessons.length} more on YouTube <Icon name="arrow" size={13} />
          </a>
        )}
      </details>}
    </Reveal>
  );
}

// #learning/completed opens that tab (Ongoing when there is none), so a tab can be linked
const tabFromHash = () => STAGES.find((s) => s.slug === location.hash.slice(1).split("/")[1])?.id || "now";

const day = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function Learning() {
  const content = useContent();
  const lessons = useLessons();
  const COURSES = useMemo(() => coursesFrom(content, lessons), [content, lessons]);
  const total = COURSES.reduce((n, t) => n + t.count, 0);
  const complete = COURSES.filter(finished).length;
  const watched = COURSES.reduce((n, t) => n + Math.min(t.done || 0, t.count), 0);
  const [tab, setTab] = useState(tabFromHash);
  const tabs = useRef([]);
  const pick = (id) => {
    haptic(5);
    setTab(id);
    history.replaceState(null, "", `#learning/${STAGES.find((s) => s.id === id).slug}`);
  };
  // arrow keys move between the tabs (Home / End jump to the ends), as tab bars do
  const onKey = (e, i) => {
    const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: STAGES.length - 1 }[e.key];
    if (n == null) return;
    e.preventDefault();
    const j = (n + STAGES.length) % STAGES.length;
    pick(STAGES[j].id);
    tabs.current[j]?.focus();
  };
  const stats = [
    ["Courses", COURSES.length],
    ["In progress", COURSES.filter((t) => !finished(t) && !unstarted(t)).length],
    ["Completed", complete],
    ["Lessons done", <>{watched}<small> / {total}</small></>],
  ];
  return (
    <>
      <Glitch text="Learning" />
      <p className="ln-lede">
        What I'm studying right now and how far I've got: AI engineering on one side, harder DSA on the other.
        All from <a href={LEARNING.by.url} target="_blank" rel="noopener noreferrer">{LEARNING.by.name}</a> on YouTube.
      </p>

      <dl className="ln-stats">
        {stats.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
      </dl>

      {/* the tab bar: Completed · Ongoing · Upcoming (opens on Ongoing) */}
      <div className="ln-tabs" role="tablist" aria-label="Courses by status">
        {STAGES.map((st, i) => {
          const on = tab === st.id;
          return (
            <button key={st.id} ref={(el) => (tabs.current[i] = el)} role="tab" id={`ln-tab-${st.id}`} aria-selected={on} aria-controls={`ln-${st.id}`}
              tabIndex={on ? 0 : -1} className={`ln-tab-${st.id} ${on ? "on" : ""}`} onClick={() => pick(st.id)} onKeyDown={(e) => onKey(e, i)}>
              {on && <motion.span className="ln-tab-pill" layoutId="ln-tab-pill" transition={REDUCED ? { duration: 0 } : SPRING} />}
              <Icon name={st.icon} size={15} />
              <span>{st.title}</span>
              <b>{COURSES.filter(st.has).length}</b>
            </button>
          );
        })}
      </div>

      {STAGES.filter((st) => st.id === tab).map((st) => {
        const list = COURSES.filter(st.has);
        return (
          <section key={st.id} className={`ln-group ln-stage-${st.id}`} id={`ln-${st.id}`} role="tabpanel" aria-labelledby={`ln-tab-${st.id}`}>
            {list.length ? (
              <ul className="ln-grid">
                {list.map((t, k) => <Course key={t.list} t={t} k={k} group={GROUPS.find((g) => g.id === t.group)} />)}
              </ul>
            ) : (
              <p className="ln-empty">{st.empty}</p>
            )}
          </section>
        );
      })}

      <p className="note">// Progress updated by hand · last on {content?.updated ? day(content.updated) : LEARNING.updated}. Lesson lists are from each playlist.</p>
    </>
  );
}
