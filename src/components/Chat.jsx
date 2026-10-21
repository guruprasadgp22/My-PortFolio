import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { haptic } from "../hooks/spring";
import Icon from "./Icons";
import { INTRO } from "./Intro";

// Anything on the site can open the assistant with openChat() or dispatchEvent(new Event("open-chat")).
export const openChat = () => dispatchEvent(new Event("open-chat"));

// The chat window and its knowledge base download on first open (or once the page is idle), not with the page.
const loadPanel = () => import("./ChatPanel");
const Panel = lazy(loadPanel);

export default function Chat({ go }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    const on = () => setOpen(true);
    addEventListener("open-chat", on);
    return () => removeEventListener("open-chat", on);
  }, []);

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            className="c-fab"
            onClick={() => (haptic(), setOpen(true))}
            onPointerEnter={loadPanel}
            aria-label="Ask GP Assistant about Guruprasad"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 420, damping: 22, delay: INTRO ? 2.15 : 0.6 }}
          >
            <span className="c-fab-ava"><img src="/me.jpg" alt="" /><Icon name="sparkle" size={12} /></span>
            <span className="c-fab-txt">Ask GP</span>
          </motion.button>
        )}
      </AnimatePresence>
      <Suspense fallback={null}>
        <AnimatePresence>{open && <Panel key="chat" onClose={close} go={go} />}</AnimatePresence>
      </Suspense>
    </>
  );
}

export { loadPanel as preloadChat };
