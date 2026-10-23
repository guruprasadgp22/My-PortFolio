import { useEffect } from "react";
import Lenis from "lenis";
import { REDUCED } from "./motion";

let lenis = null;

// Jump to the top instantly (used while the page-change curtain covers the screen).
export function jumpTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

// Smoothly bring an element to the top of the screen (with Lenis when it's running).
export function scrollToEl(el, offset = -16) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: REDUCED ? 0 : 0.9 });
  else el.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
}

export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();

// Inertial smooth scrolling (Lenis) for the window. Skipped when the visitor prefers reduced motion, and on
// wide screens, where the window doesn't scroll (the profile and the page card scroll on their own).
export default function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (REDUCED || !enabled) return;
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
  }, [enabled]);
}
