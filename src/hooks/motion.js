// Shared motion flags, read once at startup.
const mq = (q) => typeof window !== "undefined" && window.matchMedia(q).matches;

export const REDUCED = mq("(prefers-reduced-motion: reduce)"); // user asked their OS for less motion
export const FINE = mq("(pointer: fine)"); // mouse / trackpad (not touch)
