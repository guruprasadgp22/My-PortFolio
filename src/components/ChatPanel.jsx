import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { ME, PROJECTS } from "../data";
import { NAME, SECTIONS } from "../chat/knowledge";
import { faq, matchJD, OFFLINE_MISS } from "../chat/offline";
import { SPRING, haptic } from "../hooks/spring";
import { REDUCED } from "../hooks/motion";
import { startScroll, stopScroll } from "../hooks/useSmoothScroll";
import Icon from "./Icons";
import { resumeFor, VISITOR } from "../hooks/visitor";

const SUGGESTIONS = [
  `What did ${NAME} do at Sony?`,
  "What's the tech stack of FlightWise AI?",
  `When can ${NAME} join?`,
  `Why should we hire ${NAME}?`,
  `Has ${NAME} used Docker?`,
  "Say hello in Tulu",
];
const MAX_CHARS = 500;
const MAX_JD = 6000;
const STORE = "gp-chat";
const resume = resumeFor();
const linkedin = ME.socials.find((s) => s.label === "LinkedIn")?.url;
const isPhone = () => matchMedia("(max-width: 767px)").matches;

const load = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORE)) || {};
  } catch {
    return {};
  }
};

// "answer text … [[from: experience, projects]]" → { text, from }. While streaming, hides a half-written tag.
function split(raw) {
  const m = raw.match(/\[\[\s*from:\s*([^\]]*)\]\]\s*$/i);
  if (m) return { text: raw.slice(0, m.index).trim(), from: m[1].split(",").map((s) => s.trim().toLowerCase()).filter((s) => SECTIONS[s]) };
  const open = raw.lastIndexOf("[[");
  return { text: (open > -1 && raw.length - open < 60 ? raw.slice(0, open) : raw).trim(), from: [] };
}

// Tiny, safe Markdown: "- " bullets, **bold**, and clickable URLs / emails. No HTML is ever injected.
function Inline({ text }) {
  // URLs and emails stop before trailing punctuation, so "email me at x@y.com." doesn't link the full stop
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s)]*[^\s).,!?;:]|[\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <b key={i}>{p.slice(2, -2)}</b>;
    if (/^https?:\/\//.test(p)) return <a key={i} href={p} target="_blank" rel="noopener noreferrer">{p.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}</a>;
    if (/^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/.test(p)) return <a key={i} href={`mailto:${p}`}>{p}</a>;
    return p;
  });
}
function Rich({ text }) {
  const blocks = [];
  for (const line of text.split("\n")) {
    const bullet = /^\s*[-•*]\s+/.test(line);
    const last = blocks.at(-1);
    if (bullet) last?.ul ? last.items.push(line.replace(/^\s*[-•*]\s+/, "")) : blocks.push({ ul: true, items: [line.replace(/^\s*[-•*]\s+/, "")] });
    else if (line.trim()) blocks.push({ p: line });
  }
  return blocks.map((b, i) =>
    b.ul ? <ul key={i}>{b.items.map((t, k) => <li key={k}><Inline text={t} /></li>)}</ul> : <p key={i}><Inline text={b.p} /></p>
  );
}

const pop = REDUCED
  ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
  : { initial: { opacity: 0, y: 12, scale: 0.92 }, animate: { opacity: 1, y: 0, scale: 1 }, transition: { type: "spring", stiffness: 520, damping: 24 } };

function Bubble({ m, go }) {
  const { text, from } = m.role === "assistant" ? split(m.content) : { text: m.content, from: [] };
  return (
    <motion.li className={`cb ${m.role === "user" ? "me" : "bot"}`} {...pop} style={{ transformOrigin: m.role === "user" ? "100% 100%" : "0 100%" }}>
      <div className="cb-body">{text ? <Rich text={text} /> : <Dots />}</div>
      {(from.length > 0 || m.offline) && (
        <div className="cb-meta">
          {from.map((f, i) => (
            <motion.button key={f} className="cb-src" onClick={() => go(f)} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
              From: {SECTIONS[f]} <Icon name="arrow" size={11} />
            </motion.button>
          ))}
          {m.offline && <span className="cb-off">offline answer</span>}
        </div>
      )}
    </motion.li>
  );
}

const Dots = () => <span className="dots" aria-label="Typing"><i /><i /><i /></span>;

function Actions({ onCopy, copied }) {
  return (
    <div className="c-actions">
      {resume && <a href={resume} target="_blank" rel="noopener noreferrer"><Icon name="download" size={14} />Resume</a>}
      <button onClick={onCopy}><Icon name="copy" size={14} />{copied ? "Copied ✓" : "Copy email"}</button>
      <a href={`mailto:${ME.email}?subject=${encodeURIComponent(`Let's schedule a call, ${NAME}`)}`}><Icon name="phone" size={14} />Book a call</a>
      {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer"><Icon name="linkedin" size={14} />LinkedIn</a>}
    </div>
  );
}

// Job description matcher: score ring, matched / missing skills, relevant projects and a paste-ready pitch.
function Matcher({ go, saved, onSave }) {
  const [jd, setJd] = useState(saved?.jd || "");
  const [res, setRes] = useState(saved?.res || null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);

  const run = async () => {
    const text = jd.trim();
    if (text.length < 40) return setErr("Paste the full job description (at least a few lines).");
    setErr("");
    setBusy(true);
    let out = null;
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "jd", jd: text.slice(0, MAX_JD) }) });
      if (r.ok) out = await r.json();
      else if (r.status === 429) setErr(`${(await r.json()).error} Showing a quick keyword match instead.`);
    } catch {}
    out ||= matchJD(text);
    setRes(out);
    onSave({ jd: text, res: out });
    setBusy(false);
    haptic();
  };

  const R = 34, C = 2 * Math.PI * R;
  return (
    <div className="jd" data-lenis-prevent>
      <label className="jd-label" htmlFor="jd-in">Paste a job description and see how {NAME} fits.</label>
      <textarea id="jd-in" className="jd-in" value={jd} maxLength={MAX_JD} onChange={(e) => setJd(e.target.value)} placeholder="e.g. Java Backend Developer · 0–2 yrs · Java, Spring Boot, REST, Kafka, Docker, AWS…" rows={res ? 3 : 8} />
      <div className="jd-row">
        <small>{jd.length.toLocaleString()} / {MAX_JD.toLocaleString()}</small>
        <button className="form-btn" onClick={run} disabled={busy}>{busy ? <Dots /> : <><Icon name="zap" size={15} /><span>Match</span></>}</button>
      </div>
      {err && <p className="jd-err">{err}</p>}
      <AnimatePresence mode="wait">
        {res && !busy && (
          <motion.div className="jd-res" key={res.pitch} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={SPRING}>
            <div className="jd-top">
              <svg className="jd-ring" viewBox="0 0 80 80" aria-hidden="true">
                <circle cx="40" cy="40" r={R} className="bg" />
                <motion.circle cx="40" cy="40" r={R} className="fg" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - res.score / 100) }} transition={{ duration: REDUCED ? 0 : 1.1, ease: [0.2, 0.8, 0.2, 1] }} />
              </svg>
              <div>
                <b className="jd-score">{res.score}% match</b>
                {res.role && <small className="jd-role">{res.role}</small>}
                <p>{res.verdict}</p>
                <small className="jd-src">{res.source === "ai" ? "AI analysis" : "Keyword match (offline)"}</small>
              </div>
            </div>
            {res.matched.length > 0 && (
              <section><h5>Matches</h5><div className="jd-chips">{res.matched.map((s, i) => <motion.span className="ok" key={s} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.2 + i * 0.04 }}>✓ {s}</motion.span>)}</div></section>
            )}
            {res.missing.length > 0 && (
              <section><h5>Not on the profile</h5><div className="jd-chips">{res.missing.map((s) => <span className="no" key={s}>{s}</span>)}</div></section>
            )}
            {res.projects.length > 0 && (
              <section>
                <h5>Most relevant projects</h5>
                <ul className="jd-proj">
                  {res.projects.filter((p) => PROJECTS.some((x) => x.t === p.t)).map((p) => (
                    <li key={p.t}><button onClick={() => go("projects")}><b>{p.t}</b><span>{p.why}</span></button></li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <h5>Pitch for your notes</h5>
              <p className="jd-pitch">{res.pitch}</p>
              <button className="jd-copy" onClick={() => navigator.clipboard?.writeText(res.pitch).then(() => setCopied(true))}><Icon name="copy" size={13} />{copied ? "Copied ✓" : "Copy pitch"}</button>
            </section>
            <JdResume jd={jd} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// The resume that suits the pasted role: the Java Backend version for backend roles once it's in data.js.
const BACKEND = /\b(back[- ]?end|spring boot|java developer|java engineer|microservices|rest api)/i;
function JdResume({ jd }) {
  const backend = BACKEND.test(jd) && ME.resumes?.backend;
  const href = backend ? resumeFor("backend") : resumeFor(VISITOR.role);
  if (!href) return null;
  return (
    <a className="form-btn jd-resume" href={href} target="_blank" rel="noopener noreferrer">
      <Icon name="download" size={15} /><span>{backend ? "Java Backend resume" : "Resume"}</span>
    </a>
  );
}

// The chat window itself. Loaded on first open (see Chat.jsx), so it costs nothing on the first visit.
export default function Panel({ onClose, go }) {
  const saved = useRef(load()).current;
  const [tab, setTab] = useState(saved.tab || "chat");
  const [msgs, setMsgs] = useState(saved.msgs || []);
  const [jdState, setJdState] = useState(saved.jd || null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [copied, setCopied] = useState(false);
  const list = useRef(null);
  const input = useRef(null);
  const phone = useRef(isPhone()).current;
  const drag = useDragControls();

  useEffect(() => {
    try {
      sessionStorage.setItem(STORE, JSON.stringify({ tab, msgs: msgs.slice(-30), jd: jdState }));
    } catch {}
  }, [tab, msgs, jdState]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: REDUCED ? "auto" : "smooth" });
  }, [msgs]);

  useEffect(() => {
    if (phone) stopScroll();
    if (!phone) input.current?.focus({ preventScroll: true });
    const key = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", key);
    return () => {
      removeEventListener("keydown", key);
      if (phone) startScroll();
    };
  }, [onClose, phone]);

  const navigate = (id) => {
    if (phone) onClose();
    setTimeout(() => go(id), phone ? 220 : 0);
  };

  const ask = async (text) => {
    text = text.trim().slice(0, MAX_CHARS);
    if (!text || busy) return;
    haptic(6);
    const history = [...msgs, { role: "user", content: text }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setQ("");
    setBusy(true);
    const put = (patch) => setMsgs((M) => M.map((m, i) => (i === M.length - 1 ? { ...m, ...patch } : m)));
    const fallback = (note) => {
      const a = faq(text);
      setOffline(true);
      put({ content: a ? `${a.text}\n[[from: ${a.from.join(", ")}]]` : note || OFFLINE_MISS, offline: true });
    };
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chat", messages: history.map(({ role, content }) => ({ role, content })) }),
      });
      if (r.status === 429) fallback((await r.json()).error);
      else if (!r.ok || !r.body || !r.headers.get("content-type")?.startsWith("text/plain")) fallback();
      else {
        setOffline(false);
        const reader = r.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          put({ content: acc });
        }
        if (!acc.trim()) fallback();
      }
    } catch {
      fallback();
    }
    setBusy(false);
  };

  const copyEmail = () => navigator.clipboard?.writeText(ME.email).then(() => setCopied(true));
  const empty = msgs.length === 0;

  const body = (
    <>
      <header className="c-head" onPointerDown={phone ? (e) => !e.target.closest("button") && drag.start(e) : undefined}>
        <span className="c-ava"><img src="/me.jpg" alt="" /><i className={offline ? "off" : ""} /></span>
        <div>
          <b>GP Assistant</b>
          <small>{offline ? "Offline mode · basic answers" : `Answers from ${NAME}'s portfolio`}</small>
        </div>
        {msgs.length > 0 && tab === "chat" && <button className="c-clear" onClick={() => setMsgs([])} title="Start over" aria-label="Clear conversation">↺</button>}
        <button className="pd-close c-close" onClick={onClose} aria-label="Close assistant"><Icon name="x" size={16} /></button>
      </header>
      <div className="c-tabs" role="tablist">
        {[["chat", "Ask"], ["jd", "Match a job"]].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
            {tab === id && <motion.span className="c-tab-pill" layoutId="c-tab-pill" transition={SPRING} />}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === "chat" ? (
        <>
          <ul className="c-list" ref={list} data-lenis-prevent aria-live="polite">
            {empty && (
              <motion.li className="c-hello" {...pop}>
                <p>Hi! I'm GP Assistant. Ask me anything about {NAME}'s experience, projects and skills. I only answer from this portfolio, so I won't make things up.</p>
              </motion.li>
            )}
            {msgs.map((m, i) => <Bubble key={i} m={m} go={navigate} />)}
            {(empty || (!busy && msgs.length < 8)) && (
              <li className="c-sugs">
                {SUGGESTIONS.filter((s) => !msgs.some((m) => m.content === s)).slice(0, empty ? 6 : 3).map((s, i) => (
                  <motion.button key={s} onClick={() => ask(s)} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ ...SPRING, delay: 0.15 + i * 0.06 }}>{s}</motion.button>
                ))}
              </li>
            )}
          </ul>
          <Actions onCopy={copyEmail} copied={copied} />
          <form className="c-form" onSubmit={(e) => (e.preventDefault(), ask(q))}>
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} maxLength={MAX_CHARS} placeholder={`Ask about ${NAME}…`} aria-label="Your question" enterKeyHint="send" />
            <button type="submit" disabled={!q.trim() || busy} aria-label="Send"><Icon name="send" size={17} /></button>
          </form>
          <p className="c-note">AI answers can be wrong. Confirm details with {NAME}.</p>
        </>
      ) : (
        <Matcher go={navigate} saved={jdState} onSave={setJdState} />
      )}
    </>
  );

  return createPortal(
    phone ? (
      <div className="sheet-root c-root">
        <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div
          className="chat sheet-like"
          role="dialog"
          aria-modal="true"
          aria-label="GP Assistant"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={SPRING}
          drag="y"
          dragListener={false}
          dragControls={drag}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.8 }}
          onDragEnd={(_, info) => (info.offset.y > 110 || info.velocity.y > 600) && (haptic(), onClose())}
        >
          {/* drag from the handle or header to pull the sheet down; the message list scrolls normally */}
          <div className="c-grab" onPointerDown={(e) => drag.start(e)}><span className="pd-handle sheet-handle" aria-hidden="true" /></div>
          {body}
        </motion.div>
      </div>
    ) : (
      <motion.div
        className="chat side"
        role="dialog"
        aria-label="GP Assistant"
        initial={{ opacity: 0, x: 40, scale: 0.96 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 30, scale: 0.97, transition: { duration: 0.16 } }}
        transition={SPRING}
      >
        {body}
      </motion.div>
    ),
    document.body
  );
}
