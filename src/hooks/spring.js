import { REDUCED } from "./motion";

// One iOS-like spring for the whole site, so everything moves with the same weight.
// With reduce-motion on, springs become short fades/tweens.
export const SPRING = REDUCED ? { duration: 0.15 } : { type: "spring", stiffness: 380, damping: 32, mass: 0.8 };
export const SOFT = REDUCED ? { duration: 0.15 } : { type: "spring", stiffness: 260, damping: 30, mass: 0.9 };

// Tiny haptic tick on Android (iOS Safari ignores vibrate).
export const haptic = (ms = 8) => {
  try {
    navigator.vibrate?.(ms);
  } catch {}
};
