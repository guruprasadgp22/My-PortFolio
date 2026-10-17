import { JOURNEY } from "../data";
import Glitch from "./Glitch";
import Reveal from "./Reveal";
import Timeline from "./Timeline";
import JourneyMap from "./JourneyMap";

export default function Journey() {
  return (
    <>
      <Glitch text="Journey" />
      <JourneyMap />
      <Timeline icon="route" title="From first line of code to today">
        {JOURNEY.map((j, k) => (
          <Reveal as="li" className="timeline-item" key={j.yr + j.t} delay={(k % 3) * 80}>
            <span className="when">{j.yr}</span>
            <h4 className="h4 timeline-item-title">{j.t}</h4>
            <p className="timeline-text">{j.d}</p>
            <div className="stack">{j.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
          </Reveal>
        ))}
      </Timeline>
    </>
  );
}
