// Shared motion flags, read once at startup.
const mq = (q) => typeof window !== "undefined" && window.matchMedia(q).matches;

export const REDUCED = mq("(prefers-reduced-motion: reduce)"); // user asked their OS for less motion
export const FINE = mq("(pointer: fine)"); // mouse / trackpad (not touch)

// Scroll a sideways row so its child is in view, without moving the page itself (scrollIntoView would).
export function revealInRow(row, child) {
  if (!row || !child) return;
  const r = row.getBoundingClientRect(), c = child.getBoundingClientRect();
  if (c.left < r.left || c.right > r.right) row.scrollBy({ left: c.left - r.left - (r.width - c.width) / 2, behavior: REDUCED ? "auto" : "smooth" });
}
