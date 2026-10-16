import { useEffect, useRef, useState } from "react";
import useInView from "../hooks/useInView";
import { REDUCED } from "../hooks/motion";

// Number that counts up (ease-out) the first time it scrolls into view.
export default function Counter({ to, duration = 1600 }) {
  const ref = useRef(null);
  const seen = useInView(ref, 0.5);
  const [n, setN] = useState(to);

  useEffect(() => {
    if (!seen || REDUCED) return;
    let start;
    let raf;
    const step = (ts) => {
      start ??= ts;
      const p = Math.min(1, (ts - start) / duration);
      setN(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, duration]);

  return <span ref={ref}>{n.toLocaleString("en-IN")}</span>;
}
