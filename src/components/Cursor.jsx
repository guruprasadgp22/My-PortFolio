import { useEffect, useRef } from "react";
import { FINE } from "../hooks/motion";

/*
  Custom cursor for mouse/trackpad users only (touch devices keep the normal behaviour).
  Elements with data-cursor="View" show that label inside the ring.
*/
export default function Cursor() {
  const ring = useRef(null);
  const dot = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    if (!FINE) return;
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, raf;
    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.current.style.transform = `translate(${x}px,${y}px)`;
      const hov = e.target.closest?.("a,button,[data-hover],[data-cursor]");
      const text = e.target.closest?.("[data-cursor]")?.dataset.cursor || "";
      ring.current.classList.toggle("big", !!hov);
      ring.current.classList.toggle("lab", !!text);
      label.current.textContent = text;
    };
    const down = () => ring.current.classList.add("press");
    const up = () => ring.current.classList.remove("press");
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      ring.current.style.transform = `translate(${rx}px,${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    addEventListener("mousemove", move);
    addEventListener("mousedown", down);
    addEventListener("mouseup", up);
    loop();
    return () => {
      removeEventListener("mousemove", move);
      removeEventListener("mousedown", down);
      removeEventListener("mouseup", up);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="cur" ref={ring} aria-hidden="true"><span ref={label} /></div>
      <div className="cur-dot" ref={dot} aria-hidden="true" />
    </>
  );
}
