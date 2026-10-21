import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ABOUT } from "../data";
import { SPRING, haptic } from "../hooks/spring";
import confetti from "../hooks/confetti";

// "Two truths and a lie": pick the statement you think is false, then every card reveals the answer.
export default function TwoTruths() {
  const [pick, setPick] = useState(null);
  const done = pick !== null;
  const right = done && ABOUT.truths[pick].lie;

  const choose = (i, e) => {
    if (done) return;
    haptic(ABOUT.truths[i].lie ? 8 : 14);
    if (ABOUT.truths[i].lie) confetti(e.currentTarget); // spotted the lie
    setPick(i);
  };

  return (
    <div className="ttl">
      <p className="ttl-ask">{done ? (right ? "You got me. Nice detective work! 🕵️" : "Ha, that one's true! See below.") : "Two are true, one is a lie. Tap the lie."}</p>
      <ol className="ttl-list">
        {ABOUT.truths.map((t, i) => (
          <li key={t.s}>
            <motion.button
              className={`ttl-card ${done ? (t.lie ? "lie" : "truth") : ""} ${pick === i ? "picked" : ""}`}
              onClick={(e) => choose(i, e)}
              disabled={done}
              whileTap={done ? undefined : { scale: 0.97 }}
              animate={done && pick === i && !t.lie ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="ttl-n">{i + 1}</span>
              <span className="ttl-s">{t.s}</span>
              {done && <span className="ttl-tag">{t.lie ? "LIE" : "TRUE"}</span>}
            </motion.button>
            <AnimatePresence initial={false}>
              {done && (
                <motion.p
                  className="ttl-why"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ ...SPRING, delay: i * 0.08 }}
                >
                  {t.why}
                </motion.p>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ol>
      {done && (
        <button className="ttl-again" onClick={() => setPick(null)}>Play again</button>
      )}
    </div>
  );
}
