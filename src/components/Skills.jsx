import { SKILLS } from "../data";
import Glitch from "./Glitch";
import Reveal from "./Reveal";

const ALL = SKILLS.flatMap((g) => g.s);

// Skills grouped, with no scores: each chip says where the skill was used, so it can be backed up in an interview.
export default function Skills() {
  return (
    <>
      <Glitch text="Skills" />

      <div className="skill-marquee" aria-hidden="true">
        <div className="skill-track">
          {[...ALL, ...ALL].map((s, i) => <span key={i}>{s}</span>)}
        </div>
      </div>

      <ul className="skill-groups">
        {SKILLS.map((g, k) => (
          <Reveal as="li" className="skill-group content-card" key={g.h} delay={(k % 2) * 110}>
            <div className="skill-head">
              <h3 className="h5">{g.h}</h3>
              <span className="skill-count">{String(g.s.length).padStart(2, "0")} items</span>
            </div>
            <ul className="chips">
              {g.s.map((s, i) => (
                <li className={`chip ${g.at?.[s] ? "used" : ""}`} key={s} style={{ "--i": i }}>
                  {s}
                  {g.at?.[s] && <small>{g.at[s]}</small>}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ul>
    </>
  );
}
