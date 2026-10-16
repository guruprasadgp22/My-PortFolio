import { EXPERIENCE } from "../data";
import Glitch from "./Glitch";
import Reveal from "./Reveal";
import Timeline from "./Timeline";

export default function Experience() {
  return (
    <>
      <Glitch text="Experience" />
      <Timeline icon="briefcase" title="Work">
        {EXPERIENCE.map((x, k) => (
          <Reveal as="li" className="timeline-item" key={x.role + x.when} delay={k * 90}>
            <span className="when">{x.when}</span>
            <h4 className="h4 timeline-item-title">{x.role}</h4>
            <p className="timeline-org">{x.org}</p>
            <ul className="timeline-pts">{x.pts.map((p) => <li key={p}>{p}</li>)}</ul>
          </Reveal>
        ))}
      </Timeline>
    </>
  );
}
