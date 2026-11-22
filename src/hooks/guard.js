/*
  Desktop deterrent against casual inspecting (production only, never on the admin pages or in local development):
    - the right-click menu is off, except in text boxes (so paste still works there)
    - F12, Ctrl/Cmd+Shift+I / J / C (developer tools) and Ctrl/Cmd+U (view source) do nothing
    - the browser console shows a warning not to paste code there (protects visitors from "paste this" scams)
  This is a speed bump, not a lock: developer tools can still be opened from the browser's own menu, and
  everything a browser downloads can be read. The real protection lives on the server (admin API, sessions,
  rate limits, security headers), and the build ships no source maps, so only minified code is visible.
  Phones and tablets (touch, no fine pointer) are left alone: long-press menus are how people copy and share there.
*/
const desktop = () => matchMedia("(pointer: fine)").matches;
const typing = (t) => t?.closest?.("input, textarea, [contenteditable='true']");

function blockedKey(e) {
  const k = e.key?.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  if (e.key === "F12") return true;
  // Ctrl+Shift+I/J/C on Windows and Linux, Cmd+Option+I/J/C on a Mac
  if (mod && (e.shiftKey || e.altKey) && ["i", "j", "c"].includes(k)) return true;
  // the Mac's Option key turns letters into symbols, so match the physical key as well
  if (mod && (e.shiftKey || e.altKey) && ["KeyI", "KeyJ", "KeyC"].includes(e.code)) return true;
  // view source: Ctrl+U / Cmd+Option+U
  if (mod && (k === "u" || e.code === "KeyU")) return true;
  return false;
}

export function startGuard() {
  if (!import.meta.env.PROD) return;
  addEventListener("contextmenu", (e) => desktop() && !typing(e.target) && e.preventDefault());
  addEventListener("keydown", (e) => blockedKey(e) && (e.preventDefault(), e.stopPropagation()), true);
  // one clear warning in the console, for anyone who opens it anyway
  setTimeout(() => {
    console.log("%cStop!", "color:#ff6a3d;font:800 42px system-ui,sans-serif");
    console.log("%cThis is a browser feature for developers. If someone told you to paste something here, it's a scam.", "font:16px system-ui,sans-serif");
  }, 1500);
}
