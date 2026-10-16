import { useEffect, useRef, useState } from "react";
import useInView from "../hooks/useInView";
import { REDUCED } from "../hooks/motion";

const GLYPHS = "!<>-_\\/[]{}=+*^?#01";

// Text that decodes from random glyphs when it enters the view, and again on hover.
export default function Scramble({ text, className = "eyebrow", as: Tag = "div" }) {
  const ref = useRef(null);
  const seen = useInView(ref, 0.6);
  const [out, setOut] = useState(text);
  const raf = useRef(0);

  const run = () => {
    if (REDUCED) return;
    cancelAnimationFrame(raf.current);
    let frame = 0;
    const total = text.length * 2 + 10;
    const tick = () => {
      frame++;
      const revealed = Math.floor((frame / total) * text.length);
      setOut(
        [...text]
          .map((c, i) => (i < revealed || c === " " ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join("")
      );
      if (frame < total) raf.current = requestAnimationFrame(tick);
      else setOut(text);
    };
    tick();
  };

  useEffect(() => {
    if (seen) run();
    return () => cancelAnimationFrame(raf.current);
  }, [seen]);

  return (
    <Tag ref={ref} className={className} onMouseEnter={run} aria-label={text}>
      <span aria-hidden="true">{out}</span>
    </Tag>
  );
}
