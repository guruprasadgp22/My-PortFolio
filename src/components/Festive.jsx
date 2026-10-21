import { FESTIVALS } from "../data";

// A small seasonal touch, only on the festival's dates (see FESTIVALS in data.js): a row of diyas along the
// bottom of the screen for Deepavali. Decorative, ignores clicks, and stays still when reduced motion is on.
const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // "2026-11-08"
const now = FESTIVALS.find((f) => today >= f.from && today <= f.to);

export default function Festive() {
  if (!now) return null;
  return (
    <div className={`festive ${now.kind}`} aria-hidden="true" title={now.name}>
      {Array.from({ length: 5 }, (_, i) => (
        <span className="diya" key={i} style={{ "--i": i }}>
          <i className="flame" />
          <i className="lamp" />
        </span>
      ))}
    </div>
  );
}
