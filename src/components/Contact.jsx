import { useRef, useState } from "react";
import { ME } from "../data";
import Icon from "./Icons";
import Glitch from "./Glitch";
import { iconFor, handle, softBreaks } from "../socials";

export default function Contact() {
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const mail = useRef(null);
  const timer = useRef(0);

  const flash = (msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2200);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ME.email);
      flash("Email copied");
    } catch {
      // Clipboard blocked: select the text so the visitor can copy it themselves
      const r = document.createRange();
      r.selectNodeContents(mail.current);
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      flash("Email selected. Press Ctrl/⌘ + C");
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const valid = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.message.trim();

  // No backend: opens the visitor's mail app with the message filled in.
  const send = (e) => {
    e.preventDefault();
    if (!valid) return;
    const subject = encodeURIComponent(`Portfolio message from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    location.href = `mailto:${ME.email}?subject=${subject}&body=${body}`;
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

      <section className="mailbox">
        <a ref={mail} className="mailcode" href={`mailto:${ME.email}`}>{ME.email}</a>
        <button className="form-btn ghost" onClick={copy}><Icon name="copy" /><span>Copy email</span></button>
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
        <form className="form" onSubmit={send}>
          <div className="input-wrapper">
            <input className="form-input" name="name" placeholder="Full name" required value={form.name} onChange={set("name")} aria-label="Full name" />
            <input className="form-input" type="email" name="email" placeholder="Email address" required value={form.email} onChange={set("email")} aria-label="Email address" />
          </div>
          <textarea className="form-input" name="message" placeholder="Your message" required value={form.message} onChange={set("message")} aria-label="Your message" />
          <button className="form-btn" type="submit" disabled={!valid}>
            <Icon name="send" />
            <span>Send message</span>
          </button>
        </form>
      </section>

      <div className={`toast ${toast ? "on" : ""}`} role="status">{toast}</div>
    </>
  );
}
