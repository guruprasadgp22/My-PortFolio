import { createContext, useContext, useEffect, useState } from "react";

/*
  Where the page scrolls. On wide screens (≥1250px) the site works like an app: the window stays still, the
  profile on the left scrolls on its own and the page card scrolls inside itself. Scroll-linked animations
  (useScroll) read the scroller from this context; on smaller screens it's empty and they use the window.
*/
export const DESKTOP = "(min-width: 1250px)";
export const ScrollRoot = createContext({ current: null });
export const useScrollRoot = () => useContext(ScrollRoot);

// true while the screen is wide enough for the app-style layout
export function useDesktop() {
  const [on, setOn] = useState(() => matchMedia(DESKTOP).matches);
  useEffect(() => {
    const m = matchMedia(DESKTOP);
    const f = () => setOn(m.matches);
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, []);
  return on;
}
