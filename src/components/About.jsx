import { useEffect, useRef, useState } from "react";
import { ABOUT, DOING } from "../data";
import { REDUCED } from "../hooks/motion";
import useInView from "../hooks/useInView";
import Odometer from "./Odometer";
import Icon from "./Icons";
import Glitch from "./Glitch";
import Reveal from "./Reveal";

// Fake terminal that types each command, then prints its output.
function Terminal() {
  const box = useRef(null);
  const seen = useInView(box, 0.4);
  const full = ABOUT.terminal;
  const [lines, setLines] = useState(REDUCED ? full.map(([c, o]) => ({ c, o, typed: c })) : []);

  useEffect(() => {
    if (!seen || REDUCED) return;
    let cancelled = false;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    setLines([]);
    (async () => {
      for (const [c, o] of full) {
        setLines((L) => [...L, { c, o: "", typed: "" }]);
        for (let k = 1; k <= c.length; k++) {
          if (cancelled) return;
          await sleep(45 + Math.random() * 40);
          setLines((L) => L.map((l, i) => (i === L.length - 1 ? { ...l, typed: c.slice(0, k) } : l)));
        }
        await sleep(250);
        if (cancelled) return;
        setLines((L) => L.map((l, i) => (i === L.length - 1 ? { ...l, o } : l)));
        await sleep(400);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [seen]);

  const typing = lines.length < full.length || lines.at(-1)?.o === "";
  return (
    <div className="term" ref={box} aria-label="About me, written as terminal commands">
      <div className="top"><i /><i /><i /></div>
      <pre>
        {lines.map((l, i) => (
          <span key={i}>
            <span className="p">~ $ </span>
            {l.typed}
            {"\n"}
            {l.o && <span className="o">{l.o}{"\n"}</span>}
          </span>
        ))}
        {lines.length === 0 && <span className="p">~ $ </span>}
        {(typing || lines.length === full.length) && <span className="caret" />}
      </pre>
    </div>
  );
}

// Interest card that flips on hover (desktop) or tap (phones).
function Flip({ it }) {
  const [on, setOn] = useState(false);
  return (
    <button className={`flip ${on ? "on" : ""}`} onClick={() => setOn(!on)} aria-pressed={on} aria-label={`${it.title}: ${it.back}`}>
      <span className="in">
        <span className="f">
          <em aria-hidden="true">{it.icon}</em>
          <span>
            <span className="t">{it.title}</span>
            <small>#{it.tag} · tap to flip</small>
          </span>
        </span>
        <span className="bk">{it.back}</span>
      </span>
    </button>
  );
}

export default function About() {
  return (
    <>
      <Glitch text="About me" />

      <section className="about-text">
        <p>{ABOUT.bio}</p>
        <p>{ABOUT.bio2}</p>
      </section>

      <section className="block">
        <h3 className="h3">What I'm doing</h3>
        <ul className="service-list">
          {DOING.map((s, k) => (
            <Reveal as="li" className="service-item" key={s.t} delay={(k % 2) * 100}>
              <div className="service-icon-box"><Icon name={s.icon} size={26} /></div>
              <div>
                <h4 className="h4">{s.t}</h4>
                <p className="service-item-text">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="block">
        <h3 className="h3">By the numbers</h3>
        <ul className="facts">
          {ABOUT.facts.map((f, k) => (
            <Reveal as="li" className="fact" key={f.label} delay={k * 70}>
              <b><Odometer value={f.value} suffix={f.suffix} /></b>
              <span>{f.label}</span>
            </Reveal>
          ))}
        </ul>
        <Reveal><Terminal /></Reveal>
      </section>

      {ABOUT.languages?.length > 0 && (
        <section className="block">
          <h3 className="h3">Languages I speak</h3>
          <ul className="langs">
            {ABOUT.languages.map((l, k) => (
              <Reveal as="li" className="lang" key={l.n} delay={k * 80}>
                <span className="lang-ic" aria-hidden="true"><Icon name="globe" size={20} /></span>
                <span className="lang-body">
                  <b>{l.n}</b>
                  <small>{l.label}</small>
                </span>
                <span className="lang-dots" role="img" aria-label={`${l.lvl} of 5`}>
                  {[1, 2, 3, 4, 5].map((d) => <i key={d} className={d <= l.lvl ? "on" : ""} style={{ "--i": d }} />)}
                </span>
              </Reveal>
            ))}
          </ul>
        </section>
      )}

      <section className="block">
        <h3 className="h3">Beyond code</h3>
        <div className="flips">
          {ABOUT.interests.map((it, k) => <Reveal key={it.title} delay={k * 80}><Flip it={it} /></Reveal>)}
        </div>
      </section>
    </>
  );
}
