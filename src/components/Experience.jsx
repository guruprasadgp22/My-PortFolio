import { createRef, useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { EXPERIENCE } from "../data";
import { REDUCED } from "../hooks/motion";
import Glitch from "./Glitch";
import Reveal from "./Reveal";
import Timeline from "./Timeline";

// One card in the stack. It pins near the top of the screen; as the next card slides over it,
// it shrinks back and dims a little, like a deck being dealt.
function StackCard({ x, k, next }) {
  // progress of the NEXT card from entering the screen (0) to reaching the top (1)
  const { scrollYProgress } = useScroll({ target: next, offset: ["start end", "start start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, next && !REDUCED ? 0.92 : 1]);
  const dim = useTransform(scrollYProgress, [0, 1], [0, next && !REDUCED ? 0.45 : 0]);
  return (
    <motion.article className="xcard" style={{ scale }}>
      <motion.span className="xcard-dim" style={{ opacity: dim }} aria-hidden="true" />
      <header>
        <span className="when">{x.when}</span>
        <span className="xcard-n" aria-hidden="true">{String(EXPERIENCE.length - k).padStart(2, "0")}</span>
      </header>
      <h3 className="xcard-role">{x.role}</h3>
      <p className="timeline-org">{x.org}</p>
      {x.sum && <p className="xcard-sum">{x.sum}</p>}
      {x.flow && (
        <ol className="xflow" aria-label="User lifecycle I handled">
          {x.flow.map((f, i) => <li key={f} style={{ "--i": i }}>{f}</li>)}
        </ol>
      )}
      {x.tech && <div className="stack">{x.tech.map((t) => <span className="tag" key={t}>{t}</span>)}</div>}
    </motion.article>
  );
}

// "The Stack": roles pile on top of each other as you scroll (newest first), then the full details follow.
function Stack() {
  const refs = useRef(EXPERIENCE.map(() => createRef())).current;
  // Scroll tracking needs every card in the DOM first, so hand out the "next card" refs after mount.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <ol className="xstack">
      {EXPERIENCE.map((x, k) => (
        <li className="xstack-item" key={x.role + x.when} ref={refs[k]} style={{ "--k": k }}>
          <StackCard
            x={x}
            k={k}
            next={ready && k < EXPERIENCE.length - 1 ? refs[k + 1] : undefined}
          />
        </li>
      ))}
    </ol>
  );
}

export default function Experience() {
  return (
    <>
      <Glitch text="Experience" />
      <Stack />
      <Timeline icon="briefcase" title="The details">
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
