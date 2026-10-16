import { useRef } from "react";
import { REDUCED } from "../hooks/motion";

// Button or link that leans toward the cursor and springs back on leave.
export default function Magnetic({ children, className, href, onClick, strength = 0.35, ...rest }) {
  const ref = useRef(null);
  const move = (e) => {
    if (REDUCED) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength * 1.2}px)`;
  };
  const leave = () => {
    ref.current.style.transform = "";
  };
  const Tag = href ? "a" : "button";
  return (
    <Tag ref={ref} className={className} href={href} onClick={onClick} onMouseMove={move} onMouseLeave={leave} data-hover {...rest}>
      {children}
    </Tag>
  );
}
