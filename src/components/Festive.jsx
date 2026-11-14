import { useState } from "react";
import { FESTIVALS } from "../data";

/*
  A seasonal greeting, only between a festival's dates (FESTIVALS in data.js, or Pages → Festival themes in the
  admin page): a small glass pill at the bottom of the screen with the decoration and the greeting.
    kind "diwali" → a row of lit diyas;  anything else (e.g. "🎄" or "🙏🙏🙏") → those emoji, gently bobbing.
  Empty dates are open-ended (no first day = from now, no last day = until it's removed), and an empty decoration
  gets a 👋. Visitors can close it (remembered per festival); it stays still when reduced motion is on.
*/
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // "2026-11-08"
const KEY = "gp-festive-closed";
const read = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};
// "🙏🙏🎉" → ["🙏", "🙏", "🎉"] (emoji made of several code points stay whole)
const emojiOf = (s) => {
  const parts = typeof Intl.Segmenter === "function" ? [...new Intl.Segmenter().segment(s)].map((x) => x.segment) : Array.from(s);
  return parts.filter((x) => x.trim()).slice(0, 6);
};

export default function Festive() {
  const [closed, setClosed] = useState(read);
  const now = FESTIVALS.find((f) => (f?.name || f?.kind) && (!f.from || today >= f.from) && (!f.to || today <= f.to));
  if (!now) return null;
  const id = `${now.name}|${now.from}`;
  if (closed === id) return null;
  const lamps = now.kind === "diwali";
  const art = lamps ? [] : emojiOf(String(now.kind || "👋"));
  const close = () => {
    setClosed(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {}
  };
  return (
    <div className={`festive ${lamps ? "diwali" : ""}`} role="status">
      <span className="festive-art" aria-hidden="true">
        {lamps
          ? Array.from({ length: 5 }, (_, i) => (
              <span className="diya" key={i} style={{ "--i": i }}>
                <i className="flame" />
                <i className="lamp" />
              </span>
            ))
          : art.map((e, i) => <span className="festive-emoji" key={i} style={{ "--i": i }}>{e}</span>)}
      </span>
      {now.name && <span className="festive-msg">{now.name}</span>}
      <button className="festive-x" onClick={close} aria-label="Hide this greeting" title="Hide">✕</button>
    </div>
  );
}
