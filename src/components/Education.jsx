import { CERTIFICATIONS, EDUCATION } from "../data";
import Glitch from "./Glitch";
import Reveal from "./Reveal";
import Icon from "./Icons";

// Each qualification is a "ticket" card, with its score as plain text on the stub.
export default function Education() {
  return (
    <>
      <Glitch text="Education" />
      <ul className="edu-list">
        {EDUCATION.map((e, k) => (
          <Reveal as="li" className={`edu-card ${e.score ? "" : "no-score"}`} key={e.t} delay={k * 120}>
            <div className="edu-top">
              <div className="icon-box"><Icon name="cap" /></div>
              <span className="when">{e.yr}</span>
            </div>
            <h3 className="h3 edu-title">{e.t}</h3>
            <p className="edu-place">{e.p}</p>
            {e.score && (
              <div className="edu-score">
                <span className="edu-score-label">Final score</span>
                <span className="edu-score-val">{e.score}</span>
              </div>
            )}
            <span className="edu-stamp" aria-hidden="true">{e.yr.match(/\d{4}/g)?.pop()}</span>
          </Reveal>
        ))}
      </ul>

      <section className="certs">
        <div className="title-wrapper">
          <div className="icon-box"><Icon name="award" /></div>
          <h3 className="h3">Certifications</h3>
        </div>
        <ul className="cert-list">
          {CERTIFICATIONS.map((c, k) => (
            <Reveal as="li" className="cert" key={c.t} delay={(k % 3) * 70}>
              <span className="cert-seal" aria-hidden="true"><Icon name="award" size={20} /></span>
              <span className="cert-body">
                <b>{c.t}</b>
                {(c.by || c.when) && <small>{[c.by, c.when].filter(Boolean).join(" · ")}</small>}
                {c.url && <a className="cert-verify" href={c.url} target="_blank" rel="noopener noreferrer">Verify ↗</a>}
              </span>
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
