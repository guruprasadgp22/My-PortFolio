import { useEffect, useRef, useState } from "react";
import { REDUCED } from "../hooks/motion";
import useInView from "../hooks/useInView";

const CHARS = " 0123456789.%ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Airport-style split-flap board: each tile flips through characters until it lands on its target.
function Flap({ target, delay }) {
  const [ch, setCh] = useState(REDUCED ? target : " ");
  const [tick, setTick] = useState(0);
  const ref = useRef(null);
  const seen = useInView(ref, 0.6);

  useEffect(() => {
    if (!seen || REDUCED) return;
    const end = Math.max(0, CHARS.indexOf(target.toUpperCase()));
    let i = 0, t;
    const step = () => {
      setCh(CHARS[i]);
      setTick((n) => n + 1);
      if (i === end || CHARS[i] === target) return setCh(target);
      i = (i + 1) % CHARS.length;
      t = setTimeout(step, 42);
    };
    t = setTimeout(step, delay);
    return () => clearTimeout(t);
  }, [seen, target, delay]);

  return (
    <span className="flap" ref={ref}>
      <span className="flap-ch" key={tick}>{ch}</span>
    </span>
  );
}

export default function SplitFlap({ text }) {
  return (
    <span className="splitflap" aria-label={text}>
      {[...text].map((c, i) => <Flap key={i} target={c} delay={i * 90} />)}
    </span>
  );
}
