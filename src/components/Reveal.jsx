import { useEffect, useRef, useState } from "react";
import { REDUCED } from "../hooks/motion";

/*
  Scroll reveal. Content is visible by default; only elements that start
  below the fold get the "out" state, then slide/blur in when they enter.
*/
export function useReveal() {
  const ref = useRef(null);
  const [out, setOut] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || REDUCED || !("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top > window.innerHeight) setOut(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOut(false);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, out];
}

export default function Reveal({ children, delay = 0, as: Tag = "div", className = "", style, ...rest }) {
  const [ref, out] = useReveal();
  return (
    <Tag ref={ref} className={`rv ${out ? "out" : ""} ${className}`} style={{ transitionDelay: `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}
