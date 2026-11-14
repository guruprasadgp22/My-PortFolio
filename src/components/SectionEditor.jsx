import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULTS, SECTIONS } from "../data";
import Icon from "./Icons";
import { DATES, docFor, TUPLES } from "../fieldDocs";

/*
  "Pages" in the admin page: edit any section of the site's content (src/data.js) and save it to MongoDB.
  One generic form works for every section: it follows the shape of the data (text, numbers, on/off,
  lists, nested groups), so a new field in data.js is editable without new code. "Edit as JSON" is there
  for big changes, and "Use built-in" deletes the saved copy so the page goes back to data.js.
*/

// Friendlier names for the short keys used in data.js; anything else is spelled out from its key.
const LABELS = {
  t: "Title", d: "Description", n: "Name", s: "Items", g: "Group", c: "Colour", yr: "Year", org: "Organisation", cat: "Category",
  img: "Image", url: "Link", href: "Link", lat: "Latitude", lon: "Longitude", ch: "Chapter", big: "Milestone", lc: "LeetCode no.",
  at: "Where used", tags: "Tags", stack: "Tech stack", from: "From", to: "To", lie: "Is the lie", bio2: "Bio (second paragraph)",
  sum: "Summary", pts: "Highlights", tech: "Tech", flow: "How it works", when: "When", lede: "Intro line", sub: "Subtitle",
};
const labelOf = (k) => LABELS[k] || String(k).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase());
const clone = (v) => JSON.parse(JSON.stringify(v));
const Api = createContext(null); // the admin page's request helper, for image uploads

// ---------- Images ----------
// A field holds an image when its name says so or its value is an image path; it then gets a preview and Upload.
const IMAGE_KEYS = new Set(["img", "phone", "photo", "image", "cover", "src", "thumb", "logo", "avatar"]);
const isImage = (k, v) => typeof v === "string" && (IMAGE_KEYS.has(k) || v.startsWith("/api/img/") || /\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/i.test(v));
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";
const kb = (n) => `${Math.max(1, Math.round(n / 1024))} KB`;

// Resize in the browser and save as WebP (JPEG where the browser can't make WebP), so uploads stay small.
async function shrink(file, max, type = "image/webp") {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / bmp.width);
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const draw = (bg) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (bg) (ctx.fillStyle = "#fff"), ctx.fillRect(0, 0, w, h); // JPEG has no transparency
    ctx.drawImage(bmp, 0, 0, w, h);
    return c;
  };
  const blobOf = (c, t, q) => new Promise((r) => c.toBlob(r, t, q));
  let blob = type === "image/webp" ? await blobOf(draw(false), "image/webp", 0.82) : null;
  if (!blob || blob.type !== "image/webp") blob = await blobOf(draw(true), "image/jpeg", 0.85);
  return { blob, w, h, bigger: bmp.width > max };
}
const base64 = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(",")[1]);
  r.onerror = rej;
  r.readAsDataURL(blob);
});

function Library({ pick, close }) {
  const api = useContext(Api);
  const [list, setList] = useState(null);
  const [err, setErr] = useState("");
  const load = () => api("images").then((d) => setList(d.images)).catch((e) => setErr(e.message));
  useEffect(() => void load(), []);
  const remove = async (im) => {
    if (!confirm(`Delete "${im.name}" from the library?`)) return;
    try {
      await api(`images/${im.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <div className="se-lib">
      <div className="se-lib-hd"><b>Uploaded images</b><button type="button" className="ad-btn" onClick={close}>Close</button></div>
      {err && <p className="ad-err" role="alert">{err}</p>}
      {!list ? <p className="ad-muted">Loading…</p> : !list.length ? <p className="ad-muted">Nothing uploaded yet.</p> : (
        <ul>
          {list.map((im) => (
            <li key={im.id}>
              <button type="button" className="se-lib-pick" onClick={() => pick(im.url)} title={`Use ${im.name}`}>
                <img src={`${im.url}?size=small`} alt="" loading="lazy" />
                <span>{im.name}<small>{im.w}×{im.h} · {kb(im.bytes)}</small></span>
              </button>
              <button type="button" className="se-lib-del" onClick={() => remove(im)} aria-label={`Delete ${im.name}`}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Field name plus a line on what it's for (src/fieldDocs.js).
const Help = ({ text }) => (text ? <small className="se-help">{text}</small> : null);

function ImageField({ v, set, label, help }) {
  const api = useContext(Api);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [lib, setLib] = useState(false);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [v]);
  const upload = async (file) => {
    if (!file) return;
    setErr("");
    if (!ACCEPT.split(",").includes(file.type)) return setErr("Pick a PNG, JPG, WebP or GIF (SVG can't be uploaded).");
    if (file.size > 25 * 1024 * 1024) return setErr("That file is over 25 MB.");
    try {
      setBusy("Shrinking…");
      const full = await shrink(file, 1600);
      const small = full.w > 640 ? await shrink(file, 640, full.blob.type) : null;
      setBusy(`Uploading ${kb(full.blob.size)}…`);
      const r = await api("images", { method: "POST", body: { name: file.name.replace(/\.[^.]+$/, "").slice(0, 120), w: full.w, h: full.h, full: await base64(full.blob), small: small ? await base64(small.blob) : "" } });
      set(r.url);
    } catch (e) {
      setErr(e.message || "Upload failed");
    } finally {
      setBusy("");
    }
  };
  return (
    <div className="ad-field wide se-img">
      <span>{label}</span>
      <Help text={help} />
      <div className="se-img-row"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => (e.preventDefault(), upload(e.dataTransfer.files?.[0]))}>
        <div className="se-img-prev">
          {v && !broken ? <img src={v.startsWith("/api/img/") ? `${v}?size=small` : v} alt="" onError={() => setBroken(true)} /> : <span>{v ? "Can't load this image" : "No image"}</span>}
        </div>
        <div className="se-img-side">
          <input value={v} placeholder="/projects/name.jpg, or upload" onChange={(e) => set(e.target.value)} aria-label={`${label} path`} />
          <div className="ad-actions">
            <label className={`ad-btn primary ${busy ? "is-busy" : ""}`}>
              <Icon name="download" size={15} /> {busy || "Upload image"}
              <input type="file" accept={ACCEPT} hidden disabled={!!busy} onChange={(e) => (upload(e.target.files?.[0]), (e.target.value = ""))} />
            </label>
            <button type="button" className="ad-btn" onClick={() => setLib(!lib)}>Library</button>
            {v && <button type="button" className="ad-btn" onClick={() => set("")}>Remove</button>}
          </div>
          <small className="se-img-hint">Drop an image here or upload one: it's resized to 1600px and saved as WebP.</small>
          {err && <p className="ad-err" role="alert">{err}</p>}
        </div>
      </div>
      {lib && <Library pick={(url) => (set(url), setLib(false))} close={() => setLib(false)} />}
    </div>
  );
}
const isPrim = (v) => v === null || ["string", "number", "boolean"].includes(typeof v);

// An empty copy of an item with the same fields, for "Add".
function blank(v) {
  if (Array.isArray(v)) return [];
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, blank(x)]));
  return typeof v === "number" ? 0 : typeof v === "boolean" ? false : typeof v === "string" ? "" : null;
}
// What to show on a collapsed item.
function titleOf(item, i) {
  if (isPrim(item)) return String(item ?? "") || `Item ${i + 1}`;
  if (Array.isArray(item)) return item.length && isPrim(item[0]) ? String(item[0]) || `Item ${i + 1}` : `Group ${i + 1} · ${item.length} items`;
  for (const k of ["t", "title", "name", "n", "role", "label", "h", "user", "f", "s", "g", "school", "org", "k", "yr", "q"]) if (typeof item?.[k] === "string" && item[k]) return item[k];
  return `Item ${i + 1}`;
}

function Prim({ v, set, label, k, help, path }) {
  if (isImage(k, v)) return <ImageField v={v} set={set} label={label} help={help} />;
  if (typeof v === "boolean") {
    return (
      <label className="se-check">
        <input type="checkbox" checked={v} onChange={(e) => set(e.target.checked)} />
        <span>{label}<Help text={help} /></span>
      </label>
    );
  }
  const long = typeof v === "string" && (v.length > 70 || v.includes("\n"));
  return (
    <label className={`ad-field ${long ? "wide" : ""}`}>
      <span>{label}</span>
      <Help text={help} />
      {DATES.has(path) && typeof v === "string" ? (
        <input type="date" value={v} onChange={(e) => set(e.target.value)} />
      ) : typeof v === "number" ? (
        <input type="number" step="any" value={Number.isFinite(v) ? v : ""} onChange={(e) => set(e.target.value === "" ? 0 : Number(e.target.value))} />
      ) : long ? (
        <textarea rows={Math.min(8, Math.max(3, Math.ceil((v || "").length / 90)))} value={v ?? ""} onChange={(e) => set(e.target.value)} />
      ) : (
        <input value={v ?? ""} placeholder={v === null ? "empty" : undefined} onChange={(e) => set(e.target.value === "" && v === null ? null : e.target.value)} />
      )}
    </label>
  );
}

// A list of plain values (e.g. tags): one per line.
function Lines({ v, set, label, numbers, help }) {
  const [text, setText] = useState(v.join("\n"));
  useEffect(() => setText(v.join("\n")), [v.join("\n")]);
  return (
    <label className="ad-field wide">
      <span>{label}<small> · one per line</small></span>
      <Help text={help} />
      <textarea rows={Math.min(10, Math.max(3, v.length + 1))} value={text}
        onChange={(e) => {
          setText(e.target.value);
          const items = e.target.value.split("\n").map((x) => x.trim()).filter(Boolean);
          set(numbers ? items.map(Number).filter(Number.isFinite) : items);
        }} />
    </label>
  );
}

// A short fixed list with a name for each part, e.g. a highlight is [number, what it counts].
function Tuple({ v, set, names }) {
  return (
    <div className="ad-grid se-tuple">
      {names.map((part, i) => {
        const [name, help] = part.split("|");
        return (
        <label className="ad-field" key={name}>
          <span>{name}</span>
          <Help text={help} />
          <input type={typeof v[i] === "number" ? "number" : "text"} value={v[i] ?? ""}
            onChange={(e) => set(names.map((_, j) => (j === i ? (typeof v[i] === "number" ? Number(e.target.value) : e.target.value) : v[j] ?? "")))} />
        </label>
        );
      })}
    </div>
  );
}

function List({ v, set, label, tpl, path, help }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (i) => setOpen((o) => {
    const n = new Set(o);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= v.length) return;
    const next = [...v];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
    setOpen((o) => new Set([...o].map((x) => (x === i ? j : x === j ? i : x))));
  };
  const model = v[0] ?? tpl?.[0];
  const one = label.replace(/\s*\(.*\)$/, "").toLowerCase().replace(/ies$/, "y").replace(/s$/, "");
  return (
    <fieldset className="se-list">
      <legend>{label} <small>· {v.length}</small></legend>
      <Help text={help} />
      {v.map((item, i) => (
        <div className={`se-item ${open.has(i) ? "open" : ""}`} key={i}>
          <div className="se-item-hd">
            <button type="button" className="se-title" onClick={() => toggle(i)} aria-expanded={open.has(i)}>
              <Icon name="chevron" size={14} /> {titleOf(item, i)}
            </button>
            <span className="se-tools">
              <button type="button" onClick={() => move(i, -1)} disabled={!i} aria-label="Move up" title="Move up">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === v.length - 1} aria-label="Move down" title="Move down">↓</button>
              <button type="button" onClick={() => set([...v.slice(0, i + 1), clone(item), ...v.slice(i + 1)])} aria-label="Duplicate" title="Duplicate">⧉</button>
              <button type="button" className="del" onClick={() => confirm(`Remove "${titleOf(item, i)}"?`) && set(v.filter((_, j) => j !== i))} aria-label="Remove" title="Remove">✕</button>
            </span>
          </div>
          {open.has(i) && (
            <div className="se-item-body">
              <Value v={item} path={`${path}[]`} set={(x) => set(v.map((y, j) => (j === i ? x : y)))} tpl={Array.isArray(tpl) ? tpl[0] : undefined} />
            </div>
          )}
        </div>
      ))}
      <button type="button" className="ad-btn" onClick={() => (set([...v, model !== undefined ? blank(model) : ""]), setOpen((o) => new Set([...o, v.length])))}>
        + Add {one}
      </button>
    </fieldset>
  );
}

function Obj({ v, set, tpl, path }) {
  return (
    <div className="ad-grid se-obj">
      {Object.entries(v).map(([k, x]) => {
        const [label, help] = docFor(`${path}.${k}`, k) || [labelOf(k), ""];
        // a number that's counted from live data ignores what's typed, so say so right there
        const note = k === "value" && v.live ? `Counted automatically (Count automatically: "${v.live}"). Empty that box to show the number typed here.` : help;
        return <Value key={k} k={k} v={x} path={`${path}.${k}`} tpl={tpl?.[k]} set={(y) => set({ ...v, [k]: y })} label={label} help={note} />;
      })}
    </div>
  );
}

function Value({ v, set, label = "", tpl, k, path, help }) {
  if (isPrim(v)) return <Prim v={v} set={set} label={label} k={k} help={help} path={path} />;
  if (Array.isArray(v)) {
    if (TUPLES[path] && v.every(isPrim)) {
      return label ? (
        <fieldset className="se-group"><legend>{label}</legend><Help text={help} /><Tuple v={v} set={set} names={TUPLES[path]} /></fieldset>
      ) : <Tuple v={v} set={set} names={TUPLES[path]} />;
    }
    const sample = v.length ? v : Array.isArray(tpl) ? tpl : [];
    const prim = sample.length ? sample.every((x) => typeof x === "string" || typeof x === "number") : true;
    if (prim) return <Lines v={v} set={set} label={label || "Items"} help={help} numbers={sample.length > 0 && sample.every((x) => typeof x === "number")} />;
    return <List v={v} set={set} label={label || "Items"} tpl={tpl} path={path} help={help} />;
  }
  if (label) {
    return (
      <fieldset className="se-group">
        <legend>{label}</legend>
        <Help text={help} />
        <Obj v={v} set={set} tpl={tpl} path={path} />
      </fieldset>
    );
  }
  return <Obj v={v} set={set} tpl={tpl} path={path} />;
}

function SectionForm({ k, saved, run, api }) {
  const base = useMemo(() => clone(saved?.data ?? DEFAULTS[k]), [k, saved]);
  const [draft, setDraft] = useState(base);
  const [mode, setMode] = useState("form");
  const [json, setJson] = useState("");
  const [jsonErr, setJsonErr] = useState("");
  useEffect(() => (setDraft(base), setMode("form"), setJsonErr("")), [base]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  const [, title, hint] = SECTIONS.find(([x]) => x === k);

  const toJson = () => (setJson(JSON.stringify(draft, null, 2)), setJsonErr(""), setMode("json"));
  const fromJson = (text) => {
    setJson(text);
    try {
      const v = JSON.parse(text);
      if (Array.isArray(v) !== Array.isArray(DEFAULTS[k])) throw new Error(`This section must be a ${Array.isArray(DEFAULTS[k]) ? "list [ … ]" : "single object { … }"}`);
      setDraft(v);
      setJsonErr("");
    } catch (e) {
      setJsonErr(e.message);
    }
  };

  return (
    <div className="cx-card se-form">
      <header className="se-hd">
        <div>
          <h4>{title}</h4>
          <p className="ad-muted">{hint} · {saved ? `saved in the database${saved.updatedAt ? ` ${new Date(saved.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}` : "showing the built-in content"}</p>
        </div>
        <div className="cx-tabs se-mode" role="tablist" aria-label="Editor">
          <button role="tab" aria-selected={mode === "form"} className={mode === "form" ? "on" : ""} onClick={() => !jsonErr && setMode("form")} disabled={!!jsonErr}>{mode === "form" && <span className="cx-pill" />}Form</button>
          <button role="tab" aria-selected={mode === "json"} className={mode === "json" ? "on" : ""} onClick={toJson}>{mode === "json" && <span className="cx-pill" />}JSON</button>
        </div>
      </header>

      {mode === "form" ? (
        <Value v={draft} set={setDraft} tpl={DEFAULTS[k]} path={k} label={docFor(k)?.[0]} help={docFor(k)?.[1]} />
      ) : (
        <label className="ad-field wide">
          <span>Edit as JSON {jsonErr ? <small className="ad-err"> · {jsonErr}</small> : <small> · valid</small>}</span>
          <textarea className="se-json" spellCheck={false} rows={22} value={json} onChange={(e) => fromJson(e.target.value)} />
        </label>
      )}

      <div className="ad-actions se-actions">
        <button className="ad-btn primary" disabled={!dirty || !!jsonErr} onClick={() => run(() => api(`sections/${k}`, { method: "PUT", body: { data: draft } }), `${title} saved`)}>Save {title}</button>
        <button className="ad-btn" disabled={!dirty} onClick={() => (setDraft(base), setMode("form"), setJsonErr(""))}>Discard changes</button>
        {saved && <button className="ad-btn danger" onClick={() => confirm(`Delete the saved ${title} and go back to the built-in content?`) && run(() => api(`sections/${k}`, { method: "DELETE" }), `${title} back to built-in`)}>Use built-in</button>}
      </div>
    </div>
  );
}

export default function PagesTab({ saved, run, api }) {
  const [k, setK] = useState(SECTIONS[0][0]);
  return (
    <div className="se">
      <nav className="se-nav" aria-label="Sections">
        {SECTIONS.map(([id, title]) => (
          <button key={id} className={id === k ? "on" : ""} onClick={() => setK(id)} aria-current={id === k ? "true" : undefined}>
            <span>{title}</span>
            {saved?.[id] ? <i className="ad-pill">Edited</i> : <i className="ad-pill live">Built-in</i>}
          </button>
        ))}
      </nav>
      <Api.Provider value={api}>
        <SectionForm key={k} k={k} saved={saved?.[k]} run={run} api={api} />
      </Api.Provider>
    </div>
  );
}
