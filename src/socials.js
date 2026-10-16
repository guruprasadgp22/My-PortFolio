// Icon name for a social link label, and a short display handle for its URL.
export const iconFor = (label) =>
  ({ GitHub: "github", LinkedIn: "linkedin", Resume: "file", Instagram: "instagram", X: "x", Twitter: "x" })[label] || "link";
export const handle = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

// Splits a URL or email into pieces with <wbr> break points after "/" and before "@" or ".",
// so long links wrap at natural places instead of mid-word. Returns an array for JSX.
export const softBreaks = (text) =>
  text.split(/(?<=\/)|(?=[@.])/).flatMap((part, i) => (i ? [{ wbr: i }, part] : [part]));
