import { useCallback, useEffect, useState } from "react";
import Glitch from "./Glitch";
import Icon from "./Icons";
import { useLiveStats } from "../hooks/useStats";
import { refreshContent } from "../hooks/useContent";
import { BUILT_IN, GROUPS } from "../learning";
import PagesTab from "./SectionEditor";

/*
  #admin (not in the navbar): sign in as the one admin user and edit what the site shows, stored in MongoDB
  through /api/admin (netlify/functions/admin.mjs):
    Pages     any page's content (profile, about, experience, education, journey, skills, projects, …)
    Learning  course progress (lessons done), titles, topics; add or remove courses
    Coding    correct a platform's numbers when its live API is wrong or down
    Contests  add contests from platforms without a live API (CodeChef, Codeforces, …)
  Every save shows on the site within seconds.
*/
async function api(path, { method = "GET", body } = {}) {
  const r = await fetch(`/api/admin/${path}`, {
    method,
    credentials: "same-origin",
    headers: { "X-GP-Admin": "1", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = r.headers.get("content-type")?.includes("json") ? await r.json() : {};
  if (!r.ok) throw Object.assign(new Error(data.error || `Request failed (${r.status})`), { status: r.status });
  return data;
}

const PLATFORMS = [
  ["leetcode", "LeetCode", true], ["neetcode", "NeetCode", true], ["gfg", "GeeksforGeeks"], ["code360", "Code360"],
  ["hackerrank", "HackerRank"], ["hackerearth", "HackerEarth"], ["interviewbit", "InterviewBit"], ["codeforces", "Codeforces", true],
];
const CONTEST_SITES = ["CodeChef", "Codeforces", "AtCoder", "LeetCode", "Code360", "GeeksforGeeks", "HackerRank", "HackerEarth"];
const blankContest = { platform: "", name: "", date: "", rank: "", players: "", solved: "", of: "", rating: "", url: "" };
const n = (v) => (v === "" || v == null ? null : Number(v));

function Field({ label, hint, children, wide }) {
  return (
    <label className={`ad-field ${wide ? "wide" : ""}`}>
      <span>{label}{hint && <small> · {hint}</small>}</span>
      {children}
    </label>
  );
}

// What the editor lets you change, shown on the sign-in screen so it's clear what this page is for.
const CAN_EDIT = [
  ["file", "Pages", "Profile, about, experience, projects, skills and more"],
  ["book", "Learning", "Tick off lessons, add new courses"],
  ["code", "Coding", "Fix a platform's numbers if its API is wrong"],
  ["award", "Contests", "Add CodeChef, Codeforces and other contests"],
];

function Login({ onIn, setup }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const [tries, setTries] = useState(0); // re-keys the error so it shakes on every failed try
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const { user } = await api("login", { method: "POST", body: form });
      onIn(user);
    } catch (x) {
      setErr(x.message);
      setTries((t) => t + 1);
    } finally {
      setBusy(false);
    }
  };
  const capsCheck = (e) => setCaps(e.getModifierState?.("CapsLock") || false);
  return (
    <section className="lgn" aria-labelledby="lgn-title">
      <div className="lgn-card">
        <span className="lgn-glow a" aria-hidden="true" /><span className="lgn-glow b" aria-hidden="true" />

        <div className="lgn-intro">
          <span className="lgn-badge" aria-hidden="true"><Icon name="lock" size={22} /></span>
          <p className="lgn-kicker">Owner only · not visible to visitors</p>
          <h2 className="lgn-title" id="lgn-title">Site editor</h2>
          <p className="lgn-lede">Sign in to update what people see on this portfolio. Every change is saved to the database and shows on the site within seconds.</p>
        </div>

        <ul className="lgn-feats" aria-label="What you can edit">
          {CAN_EDIT.map(([icon, t, d]) => (
            <li key={t}>
              <span className="lgn-ic" aria-hidden="true"><Icon name={icon} size={16} /></span>
              <span><b>{t}</b><small>{d}</small></span>
            </li>
          ))}
        </ul>

        <form className="lgn-form" onSubmit={submit} noValidate={false}>
          <h3 className="lgn-form-title">Sign in</h3>
          {setup && <p className="lgn-info" role="status"><Icon name="server" size={16} /> {setup}</p>}

          <label className="lgn-field">
            <span>Username</span>
            <span className="lgn-input">
              <Icon name="user" size={17} />
              <input autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus={matchMedia("(hover: hover)").matches} placeholder="your admin name"
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </span>
          </label>

          <label className="lgn-field">
            <span>Password</span>
            <span className="lgn-input">
              <Icon name="lock" size={17} />
              <input type={show ? "text" : "password"} autoComplete="current-password" required placeholder="••••••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} onKeyUp={capsCheck} onKeyDown={capsCheck} />
              <button type="button" className="lgn-eye" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} aria-pressed={show}>
                <Icon name={show ? "eyeOff" : "eye"} size={17} />
              </button>
            </span>
            {caps && <small className="lgn-caps">Caps Lock is on</small>}
          </label>

          {err && <p className="lgn-err" role="alert" key={tries}>{err}</p>}

          <button className="lgn-submit" disabled={busy || !form.username || !form.password}>
            {busy ? <><span className="lgn-spin" aria-hidden="true" /> Signing in…</> : <>Sign in to edit <Icon name="next" size={16} /></>}
          </button>

          <p className="lgn-foot"><Icon name="check" size={14} /> Stays signed in for 12 hours · 5 wrong tries pause sign-in for 15 minutes</p>
        </form>
      </div>
      <a className="lgn-back" href="#about"><Icon name="chevron" size={14} /> Back to the portfolio</a>
    </section>
  );
}

// ---------- Learning ----------
function CourseRow({ c, save, remove }) {
  const [f, setF] = useState({ ...c, focus: (c.focus || []).join(", ") });
  useEffect(() => setF({ ...c, focus: (c.focus || []).join(", ") }), [c]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const bump = (d) => setF({ ...f, done: Math.max(0, Math.min(Number(f.count) || 0, (Number(f.done) || 0) + d)) });
  const changed = ["title", "sub", "group", "done", "count", "order", "focus"].some((k) => String(f[k] ?? "") !== String(k === "focus" ? (c.focus || []).join(", ") : c[k] ?? ""));
  const pct = f.count ? Math.round(((Number(f.done) || 0) / Number(f.count)) * 100) : 0;
  return (
    <li className="cx-card ad-course">
      <header>
        <b>{c.title}</b>
        <a href={`https://www.youtube.com/playlist?list=${c.list}`} target="_blank" rel="noopener noreferrer">Playlist <Icon name="arrow" size={12} /></a>
      </header>
      <div className="ad-done">
        <button type="button" className="ad-btn" onClick={() => bump(-1)} aria-label="One lesson less">−</button>
        <Field label="Lessons done" hint={`${pct}%`}><input type="number" min="0" max={f.count} value={f.done} onChange={set("done")} /></Field>
        <button type="button" className="ad-btn" onClick={() => bump(1)} aria-label="One more lesson done">+1</button>
        <Field label="Total lessons"><input type="number" min="1" value={f.count} onChange={set("count")} /></Field>
      </div>
      <details>
        <summary>Edit details</summary>
        <div className="ad-grid">
          <Field label="Title" wide><input value={f.title} onChange={set("title")} /></Field>
          <Field label="Subtitle" wide><input value={f.sub || ""} onChange={set("sub")} /></Field>
          <Field label="Section"><select value={f.group} onChange={set("group")}>{GROUPS.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></Field>
          <Field label="Order" hint="0 first"><input type="number" min="0" value={f.order ?? 0} onChange={set("order")} /></Field>
          <Field label="Topics" hint="comma separated" wide><input value={f.focus} onChange={set("focus")} /></Field>
        </div>
      </details>
      <div className="ad-actions">
        <button className="ad-btn primary" disabled={!changed} onClick={() => save(c.list, { title: f.title, sub: f.sub, group: f.group, done: n(f.done), count: n(f.count), order: n(f.order) ?? 0, focus: f.focus })}>Save</button>
        <button className="ad-btn danger" onClick={() => confirm(`Remove "${c.title}" from the Learning page?`) && remove(c.list)}>Remove</button>
      </div>
    </li>
  );
}

function LearningTab({ items, run }) {
  const [add, setAdd] = useState({ list: "", title: "", group: "ai", count: "", done: "0", sub: "", focus: "" });
  const set = (k) => (e) => setAdd({ ...add, [k]: e.target.value });
  return (
    <>
      {!items.length && (
        <div className="cx-card ad-empty">
          <p>No courses in the database yet. Copy the {BUILT_IN.length} courses the site shows now, then edit them here.</p>
          <button className="ad-btn primary" onClick={() => run(() => api("learning/import", { method: "POST", body: { courses: BUILT_IN } }), "Courses imported")}>Import current courses</button>
        </div>
      )}
      <ul className="ad-list">
        {items.map((c) => (
          <CourseRow key={c.list} c={c}
            save={(id, body) => run(() => api(`learning/${encodeURIComponent(id)}`, { method: "PUT", body }), "Course saved")}
            remove={(id) => run(() => api(`learning/${encodeURIComponent(id)}`, { method: "DELETE" }), "Course removed")} />
        ))}
      </ul>
      <form className="cx-card ad-add" onSubmit={(e) => (e.preventDefault(), run(() => api("learning", { method: "POST", body: { ...add, count: n(add.count), done: n(add.done) ?? 0 } }), "Course added").then((ok) => ok && setAdd({ ...add, list: "", title: "", count: "", done: "0", sub: "", focus: "" })))}>
        <h4>Add a course</h4>
        <div className="ad-grid">
          <Field label="YouTube playlist link" wide><input required placeholder="https://youtube.com/playlist?list=…" value={add.list} onChange={set("list")} /></Field>
          <Field label="Title" wide><input required value={add.title} onChange={set("title")} /></Field>
          <Field label="Section"><select value={add.group} onChange={set("group")}>{GROUPS.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}</select></Field>
          <Field label="Total lessons"><input required type="number" min="1" value={add.count} onChange={set("count")} /></Field>
          <Field label="Lessons done"><input type="number" min="0" value={add.done} onChange={set("done")} /></Field>
          <Field label="Subtitle"><input value={add.sub} onChange={set("sub")} /></Field>
          <Field label="Topics" hint="comma separated" wide><input value={add.focus} onChange={set("focus")} /></Field>
        </div>
        <button className="ad-btn primary">Add course</button>
      </form>
    </>
  );
}

// ---------- Coding ----------
function CodingRow({ id, label, levels, fix, live, run }) {
  const fields = levels ? ["solved", "easy", "medium", "hard"] : ["solved"];
  const [f, setF] = useState({});
  useEffect(() => setF(Object.fromEntries(fields.map((k) => [k, fix?.[k] ?? ""]))), [fix]);
  return (
    <li className="cx-card ad-coding">
      <header>
        <b>{label}</b>
        {fix && Object.values(fix).some((v) => v != null) ? <span className="ad-pill">Corrected</span> : <span className="ad-pill live">Live</span>}
      </header>
      <div className="ad-grid four">
        {fields.map((k) => (
          <Field key={k} label={k[0].toUpperCase() + k.slice(1)} hint={live?.[k] != null ? `live ${live[k]}` : undefined}>
            <input type="number" min="0" placeholder={live?.[k] ?? "–"} value={f[k] ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} />
          </Field>
        ))}
      </div>
      <div className="ad-actions">
        <button className="ad-btn primary" onClick={() => run(() => api(`coding/${id}`, { method: "PUT", body: Object.fromEntries(fields.map((k) => [k, n(f[k])])) }), `${label} saved`)}>Save</button>
        <button className="ad-btn" onClick={() => run(() => api(`coding/${id}`, { method: "DELETE" }), `${label} back to live numbers`)}>Use live numbers</button>
      </div>
    </li>
  );
}

function CodingTab({ items, run, live }) {
  return (
    <>
      <p className="ad-muted">Leave a box empty to keep the live number. A number you enter replaces it on the tiles, cards and totals.</p>
      <ul className="ad-list two">
        {PLATFORMS.map(([id, label, levels]) => <CodingRow key={id} id={id} label={label} levels={levels} fix={items[id]} live={live?.[id]} run={run} />)}
      </ul>
    </>
  );
}

// ---------- Contests ----------
function ContestsTab({ items, run }) {
  const [f, setF] = useState(blankContest);
  const [editing, setEditing] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const body = () => ({ ...f, rank: n(f.rank), players: n(f.players), solved: n(f.solved), of: n(f.of), rating: n(f.rating) });
  const submit = async (e) => {
    e.preventDefault();
    const ok = await run(() => (editing ? api(`contests/${editing}`, { method: "PUT", body: body() }) : api("contests", { method: "POST", body: body() })), editing ? "Contest updated" : "Contest added");
    if (ok) (setF(blankContest), setEditing(null));
  };
  return (
    <>
      <form className="cx-card ad-add" onSubmit={submit}>
        <h4>{editing ? "Edit contest" : "Add a contest"}</h4>
        <div className="ad-grid">
          <Field label="Platform"><input required list="ad-sites" value={f.platform} onChange={set("platform")} /></Field>
          <datalist id="ad-sites">{CONTEST_SITES.map((s) => <option key={s} value={s} />)}</datalist>
          <Field label="Date"><input required type="date" value={f.date} onChange={set("date")} /></Field>
          <Field label="Contest name" wide><input required placeholder="Starters 160 (Div 3)" value={f.name} onChange={set("name")} /></Field>
          <Field label="Rank"><input type="number" min="1" value={f.rank} onChange={set("rank")} /></Field>
          <Field label="Participants"><input type="number" min="1" value={f.players} onChange={set("players")} /></Field>
          <Field label="Solved"><input type="number" min="0" value={f.solved} onChange={set("solved")} /></Field>
          <Field label="Of problems"><input type="number" min="1" value={f.of} onChange={set("of")} /></Field>
          <Field label="Rating after" hint="empty if unrated"><input type="number" min="0" value={f.rating} onChange={set("rating")} /></Field>
          <Field label="Link" hint="optional" wide><input type="url" placeholder="https://…" value={f.url} onChange={set("url")} /></Field>
        </div>
        <div className="ad-actions">
          <button className="ad-btn primary">{editing ? "Save changes" : "Add contest"}</button>
          {editing && <button type="button" className="ad-btn" onClick={() => (setF(blankContest), setEditing(null))}>Cancel</button>}
        </div>
      </form>
      {items.length > 0 ? (
        <div className="cx-card cx-table-wrap">
          <table className="cx-table ad-table">
            <thead><tr><th>Date</th><th>Platform</th><th>Contest</th><th>Rank</th><th>Rating</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td data-label="Date">{c.date}</td>
                  <td data-label="Platform">{c.platform}</td>
                  <th scope="row" data-label="Contest">{c.name}</th>
                  <td data-label="Rank">{c.rank ?? "–"}{c.players ? ` / ${c.players}` : ""}</td>
                  <td data-label="Rating">{c.rating ?? "–"}</td>
                  <td className="ad-row-btns">
                    <button className="ad-btn" onClick={() => (setEditing(c.id), setF(Object.fromEntries(Object.keys(blankContest).map((k) => [k, c[k] ?? ""]))))}>Edit</button>
                    <button className="ad-btn danger" onClick={() => confirm(`Delete "${c.name}"?`) && run(() => api(`contests/${c.id}`, { method: "DELETE" }), "Contest deleted")}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="ad-muted">No contests added by hand yet. LeetCode and Code360 contests load live on their own.</p>
      )}
    </>
  );
}

const TABS = [["pages", "Pages", "file"], ["learning", "Learning", "book"], ["coding", "Coding", "code"], ["contests", "Contests", "award"]];

export default function Admin() {
  const [user, setUser] = useState(undefined); // undefined = checking, null = signed out
  const [setup, setSetup] = useState("");
  const [tab, setTab] = useState("pages");
  const [data, setData] = useState(null);
  const [note, setNote] = useState(null);
  const live = useLiveStats();

  useEffect(() => {
    api("me").then((d) => setUser(d.user ?? null)).catch((e) => {
      if (e.status === 503) setSetup(e.message);
      setUser(null);
    });
  }, []);

  const load = useCallback(() => api("data").then(setData).catch((e) => (e.status === 401 ? setUser(null) : setNote({ err: true, text: e.message }))), []);
  useEffect(() => {
    if (user) load();
  }, [user, load]);

  // Run a change, then reload the editor and the site's copy; true when it worked.
  const run = useCallback(async (fn, done) => {
    try {
      await fn();
      setNote({ text: `${done} · live on the site in a few seconds` });
      await Promise.all([load(), refreshContent()]);
      return true;
    } catch (e) {
      if (e.status === 401) setUser(null);
      setNote({ err: true, text: e.message });
      return false;
    }
  }, [load]);

  useEffect(() => {
    if (!note || note.err) return;
    const t = setTimeout(() => setNote(null), 4000);
    return () => clearTimeout(t);
  }, [note]);

  return (
    <>
      {user && <Glitch text="Admin" />}
      {user === undefined && <div className="heat-skel" aria-busy="true" aria-label="Checking sign-in" />}
      {user === null && <Login onIn={setUser} setup={setup} />}
      {user && (
        <>
          <div className="ad-bar">
            <span>Signed in as <b>{user}</b></span>
            <button className="ad-btn" onClick={() => api("logout", { method: "POST" }).finally(() => (setUser(null), setData(null)))}>Sign out</button>
          </div>
          <div className="cx-tabs ad-tabs" role="tablist" aria-label="What to edit">
            {TABS.map(([id, label, icon]) => (
              <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
                {tab === id && <span className="cx-pill" />}<Icon name={icon} size={15} /> {label}
              </button>
            ))}
          </div>
          {note && <p className={`ad-note ${note.err ? "err" : ""}`} role={note.err ? "alert" : "status"}>{note.text}</p>}
          {!data ? (
            <div className="heat-skel" aria-busy="true" aria-label="Loading" />
          ) : tab === "pages" ? (
            <PagesTab saved={data.sections} run={run} api={api} />
          ) : tab === "learning" ? (
            <LearningTab items={data.learning} run={run} />
          ) : tab === "coding" ? (
            <CodingTab items={data.coding} run={run} live={live} />
          ) : (
            <ContestsTab items={data.contests} run={run} />
          )}
        </>
      )}
    </>
  );
}
