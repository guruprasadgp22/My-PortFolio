import { useEffect } from "react";
import Lenis from "lenis";
import { REDUCED } from "./motion";

let lenis = null;

// Jump to the top instantly (used while the page-change curtain covers the screen).
export function jumpTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();

// Inertial smooth scrolling (Lenis). Skipped when the visitor prefers reduced motion.
export default function useSmoothScroll() {
  useEffect(() => {
    if (REDUCED) return;
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    if (document.documentElement.classList.contains("booting")) lenis.stop();
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
      lenis = null;
    };
  }, []);
}
