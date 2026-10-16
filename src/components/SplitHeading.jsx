import { useReveal } from "./Reveal";

/*
  Big section heading that rises in word by word.
  Wrap words in *asterisks* to give them the ember gradient:
  <SplitHeading text="Things I've *built*." />
*/
export default function SplitHeading({ text, className = "big" }) {
  const [ref, out] = useReveal();
  let i = 0;
  const parts = text.split("*").map((seg, k) =>
    seg
      .split(" ")
      .filter(Boolean)
      .map((w) => {
        const delay = i++ * 55;
        const word = <span style={{ transitionDelay: `${delay}ms` }}>{w}</span>;
        return (
          <span className="wd" key={`${k}-${delay}`}>
            {k % 2 ? <em>{word}</em> : word}
            {" "}
          </span>
        );
      })
  );
  return (
    <h2 ref={ref} className={`${className} split ${out ? "out" : ""}`} aria-label={text.replaceAll("*", "")}>
      <span aria-hidden="true">{parts}</span>
    </h2>
  );
}
