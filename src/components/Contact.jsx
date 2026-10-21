import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ME } from "../data";
import { SPRING } from "../hooks/spring";
import confetti from "../hooks/confetti";
import Icon from "./Icons";
import Glitch from "./Glitch";
import CopyButton from "./CopyButton";
import { iconFor, handle, softBreaks } from "../socials";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const city = ME.location.split(",")[0];
const clock = () => new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: ME.timeZone || "Asia/Kolkata" }).toLowerCase();

// "It's 2:27 pm in Bengaluru", ticking every 30 seconds.
function LocalTime() {
  const [t, setT] = useState(clock);
  useEffect(() => {
    const id = setInterval(() => setT(clock()), 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <p className="local-time">
      <i aria-hidden="true" />
      It's <b>{t}</b> in {city}{ME.replyTime ? ` · ${ME.replyTime}` : ""}
    </p>
  );
}

const check = (f) => ({
  name: !f.name.trim() ? "Please add your name." : "",
  email: !f.email.trim() ? "Please add your email so I can reply." : !EMAIL.test(f.email.trim()) ? "That email address doesn't look right." : "",
  message: f.message.trim().length < 10 ? "Please write a little more (at least 10 characters)." : "",
});

/*
  Contact form, sent with Netlify Forms (the hidden copy in index.html registers it at deploy time).
  - errors show under each field once you've left it or pressed Send
  - "company" is a honeypot: hidden from people, filled in by bots, and Netlify drops those submissions
  - if sending fails (or when running locally), it falls back to opening the visitor's mail app
*/
export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "", company: "" });
  const [touched, setTouched] = useState({});
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const mail = useRef(null);
  const sendBtn = useRef(null);
  const errors = check(form);
  const bad = Object.values(errors).some(Boolean);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const blur = (k) => () => setTouched({ ...touched, [k]: true });
  const err = (k) => touched[k] && errors[k];

  const selectEmail = () => {
    const r = document.createRange();
    r.selectNodeContents(mail.current);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
  };

  const mailto = () => {
    const subject = encodeURIComponent(`Portfolio message from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    location.href = `mailto:${ME.email}?subject=${subject}&body=${body}`;
  };

  const send = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (bad) return;
    setState("sending");
    try {
      const r = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ "form-name": "contact", ...form }).toString(),
      });
      if (!r.ok) throw new Error(String(r.status));
      setState("sent");
      confetti(sendBtn.current);
    } catch {
      setState("error");
    }
  };

  return (
    <>
      <Glitch text="Contact" />

      <section className="mapbox">
        <figure>
          <iframe
            title={`Map of ${ME.location}`}
            src={`https://maps.google.com/maps?q=${encodeURIComponent(ME.location)}&z=11&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </figure>
      </section>

      <LocalTime />

      <section className="mailbox">
        <a ref={mail} className="mailcode" href={`mailto:${ME.email}`}>{ME.email}</a>
        <CopyButton text={ME.email} label="Copy email" done="Copied" party onFail={selectEmail} />
      </section>

      <section className="block">
        <h3 className="h3 form-title">Find me online</h3>
        <ul className="social-cards">
          {ME.socials.map((s) => (
            <li key={s.label}>
              <a className="social-card" data-net={s.label.toLowerCase()} href={s.url} target="_blank" rel="noopener noreferrer">
                <span className="social-card-ic"><Icon name={iconFor(s.label)} size={22} /></span>
                <span className="social-card-txt">
                  <b>{s.label}</b>
                  <small>{softBreaks(handle(s.url)).map((x) => (typeof x === "string" ? x : <wbr key={x.wbr} />))}</small>
                </span>
                <span className="social-card-go"><Icon name="arrow" size={18} /></span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="contact-form">
        <h3 className="h3 form-title">Contact form</h3>
        <AnimatePresence mode="wait" initial={false}>
          {state === "sent" ? (
            <motion.div className="form-done" key="done" role="status" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={SPRING}>
              <span className="form-done-ic"><Icon name="check" size={26} /></span>
              <b>Thanks, {form.name.trim().split(/\s+/)[0]}! Your message is on its way.</b>
              <p>{ME.replyTime ? `${ME.replyTime}, ` : "I'll reply "}at {form.email.trim()}.</p>
              <button className="form-btn ghost" onClick={() => (setForm({ name: "", email: "", message: "", company: "" }), setTouched({}), setState("idle"))}>Send another</button>
            </motion.div>
          ) : (
            <motion.form className="form" key="form" name="contact" onSubmit={send} noValidate exit={{ opacity: 0 }}>
              {/* honeypot: people never see this field; bots fill it in and Netlify drops the message */}
              <p className="hp" aria-hidden="true">
                <label>Company <input name="company" tabIndex={-1} autoComplete="off" value={form.company} onChange={set("company")} /></label>
              </p>
              <div className="input-wrapper">
                <div className="field">
                  <input className={`form-input ${err("name") ? "bad" : ""}`} name="name" placeholder="Full name" autoComplete="name" value={form.name} onChange={set("name")} onBlur={blur("name")} aria-label="Full name" aria-invalid={!!err("name")} aria-describedby="e-name" />
                  <small className="field-err" id="e-name">{err("name")}</small>
                </div>
                <div className="field">
                  <input className={`form-input ${err("email") ? "bad" : ""}`} type="email" name="email" placeholder="Email address" autoComplete="email" value={form.email} onChange={set("email")} onBlur={blur("email")} aria-label="Email address" aria-invalid={!!err("email")} aria-describedby="e-email" />
                  <small className="field-err" id="e-email">{err("email")}</small>
                </div>
              </div>
              <div className="field">
                <textarea className={`form-input ${err("message") ? "bad" : ""}`} name="message" placeholder="Your message" value={form.message} onChange={set("message")} onBlur={blur("message")} aria-label="Your message" aria-invalid={!!err("message")} aria-describedby="e-message" />
                <small className="field-err" id="e-message">{err("message")}</small>
              </div>
              {state === "error" && (
                <p className="form-fail" role="alert">
                  Couldn't send just now. <button type="button" onClick={mailto}>Open it in your email app instead</button>
                </p>
              )}
              <button ref={sendBtn} className="form-btn" type="submit" disabled={state === "sending"}>
                <Icon name="send" />
                <span>{state === "sending" ? "Sending…" : "Send message"}</span>
              </button>
              {ME.replyTime && <p className="form-hint">{ME.replyTime}.</p>}
            </motion.form>
          )}
        </AnimatePresence>
      </section>
    </>
  );
}
