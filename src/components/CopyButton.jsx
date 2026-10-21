import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { haptic } from "../hooks/spring";
import { REDUCED } from "../hooks/motion";
import confetti from "../hooks/confetti";
import Icon from "./Icons";

/*
  A copy button that changes shape: "Copy email" springs into a ✓ "Copied", then back after 2 seconds.
  If the clipboard is blocked it calls onFail (e.g. to select the text instead).
*/
export default function CopyButton({ text, label, done = "Copied", className = "form-btn ghost", iconSize, party = false, onFail }) {
  const [ok, setOk] = useState(false);
  const btn = useRef(null);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(typeof text === "function" ? text() : text);
      haptic(10);
      setOk(true);
      if (party) confetti(btn.current);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setOk(false), 2000);
    } catch {
      onFail?.();
    }
  };

  const swap = REDUCED ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } : { initial: { opacity: 0, y: 8, scale: 0.8 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -8, scale: 0.8 } };
  return (
    <motion.button ref={btn} layout={!REDUCED} className={`${className} copy-btn ${ok ? "ok" : ""}`} onClick={copy} transition={{ type: "spring", stiffness: 520, damping: 26 }} aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={ok ? "ok" : "copy"} className="copy-in" {...swap} transition={{ type: "spring", stiffness: 520, damping: 26 }}>
          <Icon name={ok ? "check" : "copy"} size={iconSize} />
          <span>{ok ? done : label}</span>
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
