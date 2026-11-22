import { useRef } from "react";
import { REDUCED } from "../hooks/motion";
import useInView from "../hooks/useInView";

/*
  Paragraph whose words light up one after another the first time it comes into view. Words start at a
  readable grey (never faint) and always finish at full contrast within about a second, whether or not the
  page scrolls. (It used to follow the scroll position, which left text grey on screens where the page
  couldn't scroll far enough.) Screen readers get the plain text; only each word's opacity animates.
*/
export default function ScrollWords({ text, className = "" }) {
  const ref = useRef(null);
  const seen = useInView(ref, 0.2);
  if (REDUCED) return <p className={className}>{text}</p>;
  const words = text.split(" ");
  const step = Math.min(28, 900 / words.length); // the whole paragraph lights within ~0.9 s
  return (
    <p ref={ref} className={`lit-words ${seen ? "on" : ""} ${className}`}>
      {words.map((w, i) => (
        <span key={i} style={{ "--d": `${Math.round(i * step)}ms` }}>{w} </span>
      ))}
    </p>
  );
}
