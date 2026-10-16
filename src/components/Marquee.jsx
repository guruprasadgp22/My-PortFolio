import { useEffect, useRef } from "react";
import { MARQUEE } from "../data";
import { REDUCED } from "../hooks/motion";

/*
  Endless tilted ribbon of keywords. It drifts on its own and speeds up
  (and reverses direction) with your scroll velocity.
*/
export default function Marquee() {
  const track = useRef(null);

  useEffect(() => {
    if (REDUCED) return;
    let x = 0, dir = -1, last = scrollY, raf;
    const loop = () => {
      const dy = scrollY - last;
      last = scrollY;
      if (dy !== 0) dir = dy > 0 ? -1 : 1;
      x += dir * (0.6 + Math.min(Math.abs(dy) * 0.35, 18));
      const half = track.current.scrollWidth / 2;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.current.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  const all = [...MARQUEE, ...MARQUEE];
  return (
    <div className="marquee-wrap" aria-hidden="true">
      <div className="marquee">
      <div className="track" ref={track}>
        {all.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
      </div>
    </div>
  );
}
