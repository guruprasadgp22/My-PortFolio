import { useRef } from "react";
import useInView from "../hooks/useInView";

const SEGS = 20;

// Hi-fi stereo style segmented meter that lights up segment by segment when it scrolls into view.
export default function LedMeter({ value, label }) {
  const ref = useRef(null);
  const seen = useInView(ref, 0.5);
  const lit = Math.round((value / 100) * SEGS);
  return (
    <div className={`led ${seen ? "on" : ""}`} ref={ref} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      {Array.from({ length: SEGS }, (_, i) => (
        <i key={i} className={i < lit ? (i >= SEGS * 0.8 ? "hi" : i >= SEGS * 0.55 ? "mid" : "lo") : ""} style={{ "--i": i }} />
      ))}
      <b>{value}%</b>
    </div>
  );
}
