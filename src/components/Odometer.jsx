import { useRef } from "react";
import useInView from "../hooks/useInView";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

// Number that rolls into place digit by digit like a car odometer (OxygenOS style) once it scrolls into view.
// The rolling digits are drawn by CSS (::before), so screen readers, search engines and link previews
// only ever see the real number in the hidden text, never "0 1 2 3 4 5 6 7 8 9".
export default function Odometer({ value, suffix = "" }) {
  const ref = useRef(null);
  const seen = useInView(ref, 0.5);
  const text = Number(value).toLocaleString("en-IN");
  const chars = [...text];
  return (
    <span className="odo" ref={ref}>
      <span className="sr-only">{`${text}${suffix}`}</span>
      <span aria-hidden="true" className="odo-inner">
        {chars.map((c, i) =>
          /\d/.test(c) ? (
            <span className="odo-col" key={chars.length - i}>
              <span className="odo-strip" style={{ transform: `translateY(${-(seen ? +c : 0) * 10}%)`, transitionDelay: `${i * 70}ms` }}>
                {DIGITS.map((d) => <span key={d} data-d={d} />)}
              </span>
            </span>
          ) : (
            <span key={`s${chars.length - i}`} data-d={c} />
          )
        )}
        {suffix && <span className="odo-suffix" data-d={suffix} />}
      </span>
    </span>
  );
}
