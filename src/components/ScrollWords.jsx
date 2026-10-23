import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { REDUCED } from "../hooks/motion";
import { useScrollRoot } from "../hooks/scrollRoot";

function Word({ children, progress, at }) {
  const opacity = useTransform(progress, [at - 0.08, at], [0.18, 1]);
  return (
    <>
      <motion.span style={{ opacity }}>{children}</motion.span>{" "}
    </>
  );
}

// Paragraph whose words start dim and light up one by one as it scrolls up the screen (Jitter-style).
// The text stays plain and readable to screen readers; only the opacity of each word moves.
export default function ScrollWords({ text, className }) {
  const ref = useRef(null);
  const container = useScrollRoot();
  const { scrollYProgress } = useScroll({ target: ref, container, offset: ["start 0.9", "end 0.5"] });
  if (REDUCED) return <p className={className}>{text}</p>;
  const words = text.split(" ");
  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} at={(i + 1) / words.length}>{w}</Word>
      ))}
    </p>
  );
}
