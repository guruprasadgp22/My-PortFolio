import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
import { haptic } from "./hooks/spring";

// Lets CSS know JavaScript is running, so scroll-reveal styles only apply when they can finish.
document.documentElement.classList.add("js");

// A tiny haptic tick whenever something tappable is pressed on a touch screen (Android; iOS ignores it).
document.addEventListener(
  "pointerdown",
  (e) => {
    if (e.pointerType === "touch" && e.target.closest?.('button, a, [role="button"]')) haptic(6);
  },
  { passive: true }
);

// Service worker (public/sw.js): repeat visits open instantly, even offline. Production only, so local
// development always shows your latest edits.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
