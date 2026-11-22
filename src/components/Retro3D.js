import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { halftoneDots, drawHalftone } from "./Halftone";

/*
  The Home page's 3D retro computer (three.js, built from code: no model files).
    - a grey plastic CRT monitor: curved glass screen, speaker grille, three switches, a tuning window, the site's
      ember / amber / cyan stripe, a metal volume knob, printed labels and the dark tube behind
    - a keyboard (function row, main block, numpad) whose keys fly in and snap into place as you scroll
    - a mouse with its cable
  The CRT screen is a live canvas: it powers on, boots, then shows my halftone portrait (old black-and-white dots,
  cartoon style) beside a terminal that types a little about me for each part of the page.
  Scroll moves the camera (monitor → keyboard → mouse → everything); the mouse leans the camera a little.
  Hovering presses keys; real key presses press the matching 3D key and type into the terminal
  (help, about, projects, skills, contact…); clicking the screen opens the portfolio; the knob turns the CRT off/on.

  mountRetro(canvas, options) → { progress(s), key(event) → consumed?, click(event) → handled?, theme(t), dispose() }
*/

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v) => (v = clamp(v), v * v * (3 - 2 * v));
const lerp = (a, b, t) => a + (b - a) * t;
const backOut = (t) => { const c = 1.6; t = clamp(t) - 1; return 1 + (c + 1) * t * t * t + c * t * t; };

// camera keyframes along the scroll: [scroll, camera position, look-at]
const SHOTS = [
  [0.0, [3.7, 2.7, 7.4], [0.05, 1.3, 0.6]], // the monitor, three-quarter view
  [0.24, [2.2, 5.6, 7.6], [0.0, 0.65, 1.7]], // up high: keys flying in
  [0.42, [0.9, 3.9, 5.9], [-0.15, 0.25, 2.55]], // the keyboard
  [0.68, [4.0, 3.3, 7.8], [2.15, 0.15, 2.9]], // the mouse
  [1.0, [1.0, 4.4, 13.4], [0.55, 1.05, 1.4]], // everything
];

export function mountRetro(canvas, opts) {
  const { portrait, name = "GURUPRASAD", role = "", script = [], onCommand, reduced = false, mobile = false } = opts;
  let theme = opts.theme || "dark";

  // ---------- renderer, scene, camera ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  let dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  const geos = new Map();
  const rbox = (w, h, d, r = 0.04, seg = 3) => {
    const k = `${w}|${h}|${d}|${r}|${seg}`;
    if (!geos.has(k)) geos.set(k, new RoundedBoxGeometry(w, h, d, seg, r));
    return geos.get(k);
  };
  const box = (w, h, d) => rbox(w, h, d, 0.004, 1);
  const mat = (o) => new THREE.MeshStandardMaterial(o);
  const M = {
    shell: mat({ color: 0xc2c3c9, roughness: 0.52 }),
    shellDark: mat({ color: 0x2b2c32, roughness: 0.65 }),
    bezel: mat({ color: 0x0d0d10, roughness: 0.5 }),
    recess: mat({ color: 0x1a1a1f, roughness: 0.7 }),
    keyLight: mat({ color: 0xe2e2e6, roughness: 0.44 }),
    keyDark: mat({ color: 0x67686f, roughness: 0.5 }),
    keyEmber: mat({ color: 0xff6a3d, roughness: 0.45, emissive: 0x3a0f00 }),
    metal: mat({ color: 0xdcdcdf, metalness: 0.92, roughness: 0.26 }),
    white: mat({ color: 0xf4f4f6, roughness: 0.35 }),
    ember: mat({ color: 0xff6a3d, roughness: 0.4, emissive: 0xff6a3d, emissiveIntensity: 0.25 }),
    amber: mat({ color: 0xffb547, roughness: 0.4, emissive: 0xffb547, emissiveIntensity: 0.2 }),
    cyan: mat({ color: 0x3de0ff, roughness: 0.4, emissive: 0x3de0ff, emissiveIntensity: 0.2 }),
  };
  const add = (parent, geo, material, x, y, z, { shadow = true, rx = 0, ry = 0, rz = 0 } = {}) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    m.castShadow = shadow; m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ---------- monitor ----------
  const W = 2.6, H = 2.45, D = 2.1, FZ = D / 2;
  const monitor = new THREE.Group();
  scene.add(monitor);
  add(monitor, rbox(W, H, D, 0.15, 5), M.shell, 0, H / 2, 0);
  add(monitor, rbox(2.05, 2.0, 1.4, 0.22, 4), M.shellDark, 0, 1.3, -FZ - 0.5);
  add(monitor, rbox(2.26, 1.52, 0.06, 0.05, 3), M.bezel, 0, 1.64, FZ);
  // the curved CRT glass: a plane bulging out in the middle, lit by the screen canvas
  const SW = mobile ? 768 : 1024, SH = Math.round(SW * 0.75);
  const scr = document.createElement("canvas");
  scr.width = SW; scr.height = SH;
  const sctx = scr.getContext("2d");
  const screenTex = new THREE.CanvasTexture(scr);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  // mipmaps: when the screen is small (phones, the far shots) the fine dots average out instead of turning into stripes
  screenTex.generateMipmaps = true;
  screenTex.minFilter = THREE.LinearMipmapLinearFilter;
  screenTex.anisotropy = 4;
  const sGeo = new THREE.PlaneGeometry(1.66, 1.245, 28, 21);
  { const p = sGeo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) / 0.83, y = p.getY(i) / 0.6225; p.setZ(i, 0.05 * (1 - x * x) * (1 - y * y)); } sGeo.computeVertexNormals(); }
  // toneMapped off: the CRT keeps its exact colours instead of being compressed with the rest of the scene
  const screenMat = mat({ color: 0x0a0a0c, roughness: 0.18, metalness: 0, emissive: 0xffffff, emissiveMap: screenTex, emissiveIntensity: 1, envMapIntensity: 0.5, toneMapped: false });
  const screen = add(monitor, sGeo, screenMat, 0, 1.68, FZ + 0.034, { shadow: false });
  // printed labels (one transparent canvas laid over the front)
  const decal = document.createElement("canvas");
  decal.width = 1024; decal.height = Math.round(1024 * (H / W));
  {
    const c = decal.getContext("2d"), X = (x) => ((x + W / 2) / W) * decal.width, Y = (y) => ((H - y) / H) * decal.height;
    c.fillStyle = "rgba(190,190,196,.85)"; c.textAlign = "center"; c.font = "600 15px Arial, sans-serif";
    c.fillText("GP·26", X(1.0), Y(2.33));
    const ch = [["VHF", "UHF"], ["3 4", "14"], ["5", "20"], ["6", "30"], ["8", "46"], ["", "16"], ["", "65"], ["7 9", "70"], ["11", "60"], ["13", "80"], ["X-CH", "X-CHH"]];
    c.font = "500 11px Arial, sans-serif";
    ch.forEach(([a, b], i) => { const x = X(-0.9 + i * 0.185); c.fillText(a, x, Y(0.99) + i * 1.2); c.fillText(b, x, Y(0.94) + i * 1.2); });
    c.fillStyle = "rgba(60,60,66,.9)"; c.font = "700 12px Arial, sans-serif";
    c.fillText("AFC   RECALL   BAND", X(-0.2), Y(0.71)); c.fillText("OFF      ON      OFF", X(-0.2), Y(0.3));
    c.fillText("‹  TUNING  ›", X(0.42), Y(0.74)); c.fillText("PULL-ON/VOL", X(1.0), Y(0.7));
  }
  const decalTex = new THREE.CanvasTexture(decal);
  decalTex.colorSpace = THREE.SRGBColorSpace;
  add(monitor, new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: decalTex, transparent: true, depthWrite: false }), 0, H / 2, FZ + 0.032, { shadow: false });
  add(monitor, box(W - 0.06, 0.012, 0.02), M.recess, 0, 0.84, FZ, { shadow: false });
  // speaker grille
  add(monitor, box(0.64, 0.54, 0.02), M.recess, -0.86, 0.46, FZ, { shadow: false });
  for (let i = 0; i < 12; i++) add(monitor, box(0.024, 0.48, 0.03), M.shell, -1.12 + i * 0.047, 0.46, FZ + 0.006, { shadow: false });
  // switches
  add(monitor, box(0.44, 0.3, 0.02), M.recess, -0.2, 0.5, FZ, { shadow: false });
  for (let i = 0; i < 3; i++) add(monitor, rbox(0.11, 0.22, 0.07, 0.02), M.keyLight, -0.33 + i * 0.13, 0.5, FZ + 0.025);
  // tuning window and the stripe
  add(monitor, rbox(0.66, 0.3, 0.03, 0.02), M.shell, 0.42, 0.55, FZ + 0.008);
  add(monitor, box(0.56, 0.2, 0.02), M.recess, 0.42, 0.55, FZ + 0.02, { shadow: false });
  add(monitor, rbox(0.5, 0.12, 0.05, 0.02), M.white, 0.42, 0.55, FZ + 0.03);
  [M.ember, M.amber, M.cyan].forEach((m, i) => add(monitor, box(0.075, 0.05, 0.012), m, 0.34 + i * 0.08, 0.3, FZ + 0.006, { shadow: false }));
  // the volume knob (clicking it turns the CRT off / on)
  add(monitor, box(0.38, 0.38, 0.03), M.recess, 1.0, 0.45, FZ + 0.005, { shadow: false });
  const knob = add(monitor, new THREE.CylinderGeometry(0.11, 0.125, 0.13, 40), M.metal, 1.0, 0.45, FZ + 0.08, { rx: Math.PI / 2 });
  add(knob, new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), M.recess, 0.06, 0.066, 0, { shadow: false });
  // side vents
  for (let i = 0; i < 5; i++) add(monitor, box(0.02, 0.3, 0.035), M.shell, W / 2 + 0.006, 0.5, 0.55 + i * 0.065, { shadow: false });

  // ---------- keyboard ----------
  const kb = new THREE.Group();
  kb.position.set(-0.15, 0, 2.75);
  scene.add(kb);
  // the case (it rises into place with the first keys, so the first view shows only the monitor)
  const kbCase = new THREE.Group();
  kb.add(kbCase);
  add(kbCase, rbox(3.5, 0.2, 1.3, 0.08, 4), M.shell, 0, 0.1, 0);
  add(kbCase, box(3.28, 0.02, 1.08), M.recess, 0, 0.205, -0.02, { shadow: false });
  [M.ember, M.amber, M.cyan].forEach((m, i) => add(kbCase, box(0.075, 0.045, 0.012), m, 1.18 + i * 0.08, 0.1, 0.652, { shadow: false }));
  const U = 0.165, KEY_Y = 0.262;
  const rows = [
    [["Escape", 1, "e"], [null, 1], ["F1"], ["F2"], ["F3"], ["F4"], [null, 0.5], ["F5"], ["F6"], ["F7"], ["F8"], [null, 0.5], ["F9"], ["F10"], ["F11"], ["F12"]],
    [["Backquote"], ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => [`Digit${d}`, 1, "l"]), ["Minus", 1, "l"], ["Equal", 1, "l"], ["Backspace", 2]],
    [["Tab", 1.5], ..."QWERTYUIOP".split("").map((c) => [`Key${c}`, 1, "l"]), ["BracketLeft", 1, "l"], ["BracketRight", 1, "l"], ["Backslash", 1.5]],
    [["CapsLock", 1.75], ..."ASDFGHJKL".split("").map((c) => [`Key${c}`, 1, "l"]), ["Semicolon", 1, "l"], ["Quote", 1, "l"], ["Enter", 2.25, "e"]],
    [["ShiftLeft", 2.25], ..."ZXCVBNM".split("").map((c) => [`Key${c}`, 1, "l"]), ["Comma", 1, "l"], ["Period", 1, "l"], ["Slash", 1, "l"], ["ShiftRight", 2.75]],
    [["ControlLeft", 1.25], ["MetaLeft", 1.25], ["AltLeft", 1.25], ["Space", 6.25, "l"], ["AltRight", 1.25], ["MetaRight", 1.25], ["ContextMenu", 1.25], ["ControlRight", 1.25]],
  ];
  const pad = [
    [["Insert"], ["Home"], ["PageUp"], ["Delete"]],
    [["NumLock"], ["NumpadDivide"], ["NumpadMultiply"], ["NumpadSubtract"]],
    [["Numpad7", 1, "l"], ["Numpad8", 1, "l"], ["Numpad9", 1, "l"], ["NumpadAdd"]],
    [["Numpad4", 1, "l"], ["Numpad5", 1, "l"], ["Numpad6", 1, "l"], ["NumpadEqual"]],
    [["Numpad1", 1, "l"], ["Numpad2", 1, "l"], ["Numpad3", 1, "l"], ["NumpadEnter"]],
    [["Numpad0", 2, "l"], ["NumpadDecimal", 1, "l"], [null, 1]],
  ];
  const keys = [], byCode = new Map();
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const placeRow = (row, r, x0) => {
    let x = x0;
    for (const [code, w = 1, kind] of row) {
      if (code) {
        const kw = w * U - 0.026;
        const material = kind === "e" ? M.keyEmber : kind === "l" ? M.keyLight : M.keyDark;
        const mesh = add(kb, rbox(kw, 0.085, U - 0.026, 0.026, 2), material, 0, 0, 0);
        const home = new THREE.Vector3(x + (w * U) / 2, KEY_Y, -0.46 + r * 0.183 + (r === 0 ? -0.03 : 0));
        const from = home.clone().add(new THREE.Vector3((rnd() - 0.5) * 3.2, 1.4 + rnd() * 2.6, (rnd() - 0.7) * 2.2));
        const k = { mesh, home, from, rot: new THREE.Euler((rnd() - 0.5) * 3, (rnd() - 0.5) * 3, (rnd() - 0.5) * 3), delay: rnd() * 0.6, press: 0, hover: 0, code };
        keys.push(k);
        byCode.set(code, k);
        mesh.userData.key = k;
      }
      x += w * U;
    }
  };
  rows.forEach((row, r) => placeRow(row, r, -1.62));
  pad.forEach((row, r) => placeRow(row, r, 1.0));
  const keyMeshes = keys.map((k) => k.mesh);

  // ---------- mouse and cable ----------
  const mouse3 = new THREE.Group();
  mouse3.position.set(2.45, 0, 2.95);
  mouse3.rotation.y = -0.12;
  scene.add(mouse3);
  add(mouse3, rbox(0.64, 0.2, 0.94, 0.09, 5), M.shell, 0, 0.1, 0);
  add(mouse3, rbox(0.27, 0.03, 0.3, 0.012, 2), M.keyDark, -0.15, 0.205, -0.27);
  add(mouse3, rbox(0.27, 0.03, 0.3, 0.012, 2), M.keyDark, 0.15, 0.205, -0.27);
  [M.ember, M.amber, M.cyan].forEach((m, i) => add(mouse3, box(0.06, 0.04, 0.01), m, -0.12 + i * 0.065, 0.1, 0.471, { shadow: false }));
  const cable = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[0, 0.12, -0.47], [0.05, 0.05, -0.85], [-0.2, 0.03, -1.3], [-0.6, 0.03, -1.75], [-1.0, 0.1, -2.05], [-1.2, 0.35, -2.2]].map((p) => new THREE.Vector3(...p))), 80, 0.018, 8),
    M.shell
  );
  cable.castShadow = true;
  mouse3.add(cable);

  // ---------- floor, lights ----------
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.5 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  const hemi = new THREE.HemisphereLight(0xfff2e6, 0x20141a, 0.3);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.55);
  sun.position.set(-4.5, 8, 6.5);
  sun.target.position.set(0.3, 0.4, 1.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 25 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0xff7a45, 1.7);
  rim.position.set(5, 4, -5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x9fd8ff, 0.35);
  fill.position.set(6, 2, 5);
  scene.add(fill);
  // the screen's light on the keyboard: a spotlight pointing down and away from the screen, so the glass
  // never shows it as a hot spot
  const glow = new THREE.SpotLight(0xffe7c8, 0, 5, 0.95, 1, 1.6);
  glow.position.set(0, 0.6, 1.5);
  glow.target.position.set(0, 0, 3.1);
  scene.add(glow, glow.target);

  // ---------- the CRT screen: boot, portrait, terminal ----------
  const S = SW / 1024; // design units → canvas pixels
  const img = new Image();
  img.src = portrait;
  let art = null;
  img.onload = () => { art = halftoneDots(img, { x: 30 * S, y: 66 * S, w: 440 * S, h: 640 * S }, 7 * S); };
  // the retro pixel font (from the page's Google Fonts), with monospace fallbacks while it loads
  document.fonts?.load(`${30 * S}px VT323`).catch(() => {});
  const font = (px) => `${px * S}px VT323, "JetBrains Mono", ui-monospace, Menlo, monospace`;
  // set the font, shrunk if needed so the text fits the width (whatever font is in use)
  const fit = (c, text, px, max) => {
    c.font = font(px);
    const w = c.measureText(text).width;
    if (w > max) c.font = font((px * max) / w);
  };
  const scan = document.createElement("canvas");
  scan.width = SW; scan.height = SH;
  {
    const c = scan.getContext("2d");
    c.fillStyle = "rgba(0,0,0,.24)";
    for (let y = 0; y < SH; y += 3 * S) c.fillRect(0, y, SW, Math.max(1, S));
    const v = c.createRadialGradient(SW / 2, SH / 2, SH * 0.32, SW / 2, SH / 2, SW * 0.68);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.7)");
    c.fillStyle = v; c.fillRect(0, 0, SW, SH);
    // the tube's rounded corners
    c.fillStyle = "#000";
    c.beginPath(); c.rect(0, 0, SW, SH); c.roundRect(10 * S, 10 * S, SW - 20 * S, SH - 20 * S, 60 * S); c.fill("evenodd");
  }

  const power = { on: true, at: performance.now() / 1000 + (reduced ? -10 : 0.25) }; // when the last on/off began
  const BOOT = reduced ? 0 : 1.9;
  const term = { lines: [], typing: null, input: "", stage: -1, mouse: { x: -1e4, y: -1e4 } };
  const pushLine = (t, c = "#e8dfcc") => {
    // wrap to the terminal column
    sctx.font = font(31);
    const words = String(t).split(" ");
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (sctx.measureText(next).width > 470 * S && cur) (term.lines.push({ t: cur, c }), (cur = w));
      else cur = next;
    }
    term.lines.push({ t: cur, c });
    while (term.lines.length > 8) term.lines.shift();
  };
  const run = (cmd, out, now) => (term.typing = { cmd, out, at: now, shown: -1 });
  // which 3D key a character presses
  const codeFor = (ch) => (/[a-z]/i.test(ch) ? `Key${ch.toUpperCase()}` : /\d/.test(ch) ? `Digit${ch}` : { " ": "Space", ".": "Period", "/": "Slash", "-": "Minus", "~": "Backquote", ",": "Comma", ";": "Semicolon" }[ch]);
  const tap = (code, strength = 1) => { const k = byCode.get(code); if (k) k.press = Math.max(k.press, strength); };

  const drawScreen = (now) => {
    const t = now / 1000, c = sctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.shadowBlur = 0;
    c.fillStyle = "#050407";
    c.fillRect(0, 0, SW, SH);
    const since = t - power.at;
    // CRT on / off: a line that opens into the picture (and closes back to a dot)
    const T = reduced ? 0.001 : 0.55;
    let open = power.on ? clamp(since / T) : 1 - clamp(since / T);
    if (!power.on && open <= 0) {
      const dot = 1 - clamp((since - T) / 0.5);
      if (dot > 0) { c.fillStyle = `rgba(255,245,230,${dot})`; c.beginPath(); c.arc(SW / 2, SH / 2, 4 * S * dot, 0, Math.PI * 2); c.fill(); }
      c.drawImage(scan, 0, 0);
      return;
    }
    if (open < 0.45) {
      const w = SW * 0.92 * smooth(open / 0.45);
      c.fillStyle = "#fff6ea";
      c.fillRect((SW - w) / 2, SH / 2 - 2 * S, w, 4 * S);
      c.drawImage(scan, 0, 0);
      return;
    }
    const hgt = SH * smooth((open - 0.45) / 0.55);
    c.save();
    c.beginPath(); c.rect(0, (SH - hgt) / 2, SW, hgt); c.clip();
    const on = t - power.at - T; // seconds since the picture opened
    if (power.on && on < BOOT) {
      // boot sequence
      const L = ["GP-26 BIOS v2.6  (c) 2026", "MEMORY TEST ...... 640K OK", "LOADING guruprasad.profile", "PORTRAIT.DOTS ...... OK"];
      c.font = font(30); c.fillStyle = "#ffb547"; c.shadowColor = "rgba(255,181,71,.6)"; c.shadowBlur = 8 * S;
      L.forEach((l, i) => { const n = Math.floor((on - i * 0.32) * 40); if (n > 0) c.fillText(l.slice(0, n), 60 * S, (110 + i * 46) * S); });
      const bar = clamp((on - 1.2) / 0.6);
      c.fillText(`[${"█".repeat(Math.round(bar * 24)).padEnd(24, "·")}] ${Math.round(bar * 100)}%`, 60 * S, 330 * S);
    } else {
      const el = Math.max(0, on - BOOT);
      if (art) drawHalftone(c, art, el, { ink: "#efe6d2", edge: "#ffb27a", mouse: term.mouse, still: reduced, reach: 70 * S, push: 10 * S });
      const X = 510 * S;
      c.shadowColor = "rgba(255,190,120,.55)"; c.shadowBlur = 10 * S;
      c.fillStyle = "#f7efe0"; fit(c, name, 96, 470 * S); c.fillText(name, X, 132 * S);
      c.fillStyle = "#ffb547"; fit(c, role.toUpperCase(), 35, 470 * S); c.fillText(role.toUpperCase(), X, 180 * S);
      c.shadowBlur = 0; c.fillStyle = "rgba(255,181,71,.35)"; c.fillRect(X, 204 * S, 460 * S, 2 * S);
      // terminal: finished lines, then whatever is being typed
      c.shadowColor = "rgba(255,200,140,.45)"; c.shadowBlur = 6 * S; c.font = font(31);
      const ty = term.typing;
      if (ty) {
        const n = Math.floor((t - ty.at) * 26);
        if (n >= ty.cmd.length) {
          // command typed: print its output, one line every 0.09 s
          const k = Math.floor((t - ty.at - ty.cmd.length / 26) / 0.09);
          if (ty.shown < 0) (pushLine(`~$ ${ty.cmd}`, "#ffb547"), (ty.shown = 0));
          while (ty.shown < Math.min(k, ty.out.length)) pushLine(ty.out[ty.shown++]);
          if (ty.shown >= ty.out.length) term.typing = null;
        } else if (n > 0 && ty.last !== n) {
          ty.last = n;
          const code = codeFor(ty.cmd[n - 1]);
          if (code && kbOn > 0.95) tap(code, 0.9);
        }
      }
      term.lines.forEach((l, i) => { c.fillStyle = l.c; c.fillText(l.t, X, (256 + i * 40) * S); });
      let y = (256 + term.lines.length * 40) * S;
      if (term.typing && term.typing.shown < 0) {
        const n = Math.floor((t - term.typing.at) * 26);
        c.fillStyle = "#ffb547"; c.fillText(`~$ ${term.typing.cmd.slice(0, n)}`, X, y);
        y += 40 * S;
      }
      // the visitor's own prompt, with a blinking block cursor
      const py = Math.max(y, 650 * S);
      const prompt = `guest@gp:~$ ${term.input}`;
      c.fillStyle = "#9fe8ff"; c.fillText(prompt, X, py);
      if (Math.floor(t * 2) % 2 === 0) { const w = c.measureText(prompt).width; c.fillRect(X + w + 4 * S, py - 25 * S, 14 * S, 29 * S); }
      if (!term.input && !term.typing) { c.shadowBlur = 0; c.fillStyle = "rgba(200,190,175,.6)"; c.font = font(25); c.fillText(mobile ? "tap the screen to open the portfolio" : "type `help` · click the screen to open", X, py + 38 * S); }
    }
    // a slow bright band rolling down, and a little flicker
    const band = ((t * 0.18) % 1.4 - 0.2) * SH;
    const g = c.createLinearGradient(0, band - 60 * S, 0, band + 60 * S);
    g.addColorStop(0, "rgba(255,240,220,0)"); g.addColorStop(0.5, "rgba(255,240,220,.05)"); g.addColorStop(1, "rgba(255,240,220,0)");
    c.shadowBlur = 0; c.fillStyle = g; c.fillRect(0, band - 60 * S, SW, 120 * S);
    if (open < 1) { c.fillStyle = `rgba(255,248,236,${(1 - open) * 0.9})`; c.fillRect(0, 0, SW, SH); }
    c.restore();
    c.drawImage(scan, 0, 0);
  };

  // ---------- scroll, pointer, camera ----------
  let s = 0, kbOn = reduced ? 1 : 0, view = { w: 1, h: 1 };
  const ptr = { x: 0, y: 0, sx: 0, sy: 0, has: false, cx: -1, cy: -1 };
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3(), wantPos = new THREE.Vector3(), wantTgt = new THREE.Vector3();
  const shot = (v) => {
    let i = 0;
    while (i < SHOTS.length - 2 && v > SHOTS[i + 1][0]) i++;
    const [a, pa, ta] = SHOTS[i], [b, pb, tb] = SHOTS[i + 1];
    const f = smooth((v - a) / (b - a));
    // further back on narrow (portrait) screens, so everything still fits
    const far = clamp(1.3 / (view.w / view.h), 1, 2.2);
    wantTgt.set(lerp(ta[0], tb[0], f), lerp(ta[1], tb[1], f), lerp(ta[2], tb[2], f));
    wantPos.set(lerp(pa[0], pb[0], f), lerp(pa[1], pb[1], f), lerp(pa[2], pb[2], f)).sub(wantTgt).multiplyScalar(far).add(wantTgt);
  };
  shot(0);
  camPos.copy(wantPos); camTgt.copy(wantTgt);

  const resize = () => {
    const r = canvas.parentElement.getBoundingClientRect();
    view = { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    renderer.setSize(view.w, view.h, false);
    camera.aspect = view.w / view.h;
    // leave room for the text cards: on wide screens the scene sits right of centre, on narrow ones above it
    const wide = view.w > 900;
    camera.setViewOffset(view.w, view.h, wide ? -view.w * 0.17 : 0, wide ? 0 : view.h * 0.17, view.w, view.h);
    camera.updateProjectionMatrix();
    shot(s);
    if (reduced) frame(performance.now());
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = () => {
    if (!ptr.has) return null;
    ndc.set(ptr.x, ptr.y);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([screen, knob, ...keyMeshes], false)[0];
    return hit || null;
  };

  let hovered = null, tick = 0;
  const frame = (now) => {
    // keys fly in and snap into place; the mouse slides in
    const kWant = reduced ? 1 : smooth((s - 0.06) / 0.32);
    kbOn = reduced ? 1 : lerp(kbOn, kWant, 0.12);
    const mOn = reduced ? 1 : smooth((s - 0.46) / 0.18);
    for (const k of keys) {
      const p = backOut(clamp((kbOn - k.delay * 0.6) / 0.4));
      k.press *= 0.86;
      const down = Math.max(k.press, k.hover) * 0.05;
      k.mesh.position.set(lerp(k.from.x, k.home.x, p), lerp(k.from.y, k.home.y, p) - down * (p > 0.98 ? 1 : 0), lerp(k.from.z, k.home.z, p));
      const q = 1 - clamp(p);
      k.mesh.rotation.set(k.rot.x * q, k.rot.y * q, k.rot.z * q);
      k.mesh.visible = kbOn > 0.002;
    }
    const c = smooth(kbOn / 0.22);
    kbCase.visible = c > 0.001;
    kbCase.position.set(0, (1 - c) * 1.6, (1 - c) * 1.2);
    kbCase.rotation.x = (1 - c) * -0.5;
    mouse3.position.x = 2.45 + (1 - mOn) * 3.2;
    mouse3.rotation.y = -0.12 - (1 - mOn) * 0.6;
    // camera: ease toward the scroll's shot, plus a little lean toward the pointer
    shot(s);
    ptr.sx = lerp(ptr.sx, ptr.has ? ptr.x : 0, 0.06);
    ptr.sy = lerp(ptr.sy, ptr.has ? ptr.y : 0, 0.06);
    const ease = reduced ? 1 : 0.075;
    camPos.lerp(wantPos, ease); camTgt.lerp(wantTgt, ease);
    camera.position.copy(camPos).add(new THREE.Vector3(ptr.sx * 0.45, ptr.sy * 0.25, 0));
    camera.lookAt(camTgt);
    // hover: keys go down under the pointer, the screen and knob invite a click
    const hit = pick();
    const hk = hit?.object.userData.key || null;
    if (hovered && hovered !== hk) hovered.hover = 0;
    if (hk) hk.hover = 0.8;
    hovered = hk;
    canvas.dataset.hover = hit && (hit.object === screen || hit.object === knob) ? "1" : "";
    if (hit?.object === screen && hit.uv) { term.mouse.x = hit.uv.x * SW; term.mouse.y = (1 - hit.uv.y) * SH; }
    else { term.mouse.x = term.mouse.y = -1e4; }
    // the screen: its stage follows the scroll; it lights the keyboard while on
    const stage = s < 0.18 ? 0 : s < 0.5 ? 1 : s < 0.82 ? 2 : 3;
    if (stage !== term.stage && power.on && now / 1000 - power.at > BOOT + 0.6) {
      term.stage = stage;
      const sc = script[stage];
      if (sc) { term.lines = []; run(sc.cmd, sc.out, now / 1000); }
    }
    glow.intensity = lerp(glow.intensity, power.on ? 6 : 0, 0.08);
    // the screen redraws every other frame (30 fps is plenty for a CRT, and halves the texture uploads)
    if (reduced || (tick++ & 1) === 0) { drawScreen(now); screenTex.needsUpdate = true; }
    knob.rotation.y = lerp(knob.rotation.y, power.on ? 0 : -1.4, 0.15);
    renderer.render(scene, camera);
  };

  // Adaptive quality: every ~40 frames, if most of them took longer than ~28 ms, render at a lower resolution
  // (down to 1x); if that's still slow, drop the shadows. Weak GPUs stay smooth instead of dragging the page.
  let raf = 0, alive = true, prev = 0, slow = 0, count = 0;
  const adapt = (now) => {
    const dt = prev ? now - prev : 16;
    prev = now;
    if (dt > 250) return; // a hidden tab or a one-off stall: not a measure of speed
    count++;
    if (dt > 28) slow++;
    if (count < 40) return;
    if (slow > 28) {
      if (dpr > 1.01) { dpr = Math.max(1, dpr - 0.4); renderer.setPixelRatio(dpr); resize(); }
      else if (renderer.shadowMap.enabled) {
        renderer.shadowMap.enabled = false;
        sun.castShadow = false;
        floor.visible = false;
        scene.traverse((o) => o.material && (o.material.needsUpdate = true));
      }
    }
    count = slow = 0;
  };
  const loop = (now) => { if (!alive) return; adapt(now); frame(now); raf = requestAnimationFrame(loop); };
  const vis = () => { cancelAnimationFrame(raf); if (!document.hidden && alive && !reduced) raf = requestAnimationFrame(loop); };
  document.addEventListener("visibilitychange", vis);
  const onMove = (e) => {
    const r = canvas.getBoundingClientRect();
    ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ptr.has = true;
    if (reduced) frame(performance.now());
  };
  const onLeave = () => (ptr.has = false);
  addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", onLeave);
  resize();
  // compile every material and draw once now, so the page's entrance animation never waits on it
  renderer.compile(scene, camera);
  frame(performance.now());
  if (!reduced) raf = requestAnimationFrame(loop);

  // ---------- what the page can ask ----------
  const exec = (raw) => {
    const cmd = raw.trim().toLowerCase();
    pushLine(`guest@gp:~$ ${raw}`, "#9fe8ff");
    if (!cmd) return;
    const res = onCommand?.(cmd) || { out: [`command not found: ${cmd}`, "try: help"] };
    if (res.clear) term.lines = [];
    res.out.forEach((l) => pushLine(l, res.color));
  };
  const api = {
    progress(v) { s = clamp(v); if (reduced) frame(performance.now()); },
    // a real key press: the matching 3D key goes down; printable keys type into the CRT prompt
    key(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return false;
      tap(e.code, 1);
      if (!power.on) return false;
      if (term.typing) { const ty = term.typing; ty.at = -1e9; } // finish the self-typing at once
      if (e.key === "Enter") { if (!term.input) return false; exec(term.input); term.input = ""; return true; }
      if (e.key === "Backspace") { if (!term.input) return false; term.input = term.input.slice(0, -1); return true; }
      if (e.key.length === 1 && /[\w .\-/~]/.test(e.key)) {
        // only a letter starts a command: while the prompt is empty, Space still scrolls and 1-9, / and ? keep
        // their site-wide shortcuts
        if (!term.input && !/[a-z]/i.test(e.key)) return false;
        if (term.input.length < 26) term.input += e.key;
        return true;
      }
      return false;
    },
    // a click on the page outside the cards: the screen opens the portfolio, the knob switches the CRT
    click() {
      const hit = pick();
      if (!hit) return null;
      if (hit.object === knob) { power.on = !power.on; power.at = performance.now() / 1000; term.stage = -1; return "knob"; }
      if (hit.object === screen) return "screen";
      if (hit.object.userData.key) { hit.object.userData.key.press = 1; return "key"; }
      return null;
    },
    theme(t) {
      theme = t;
      floorMat.opacity = t === "light" ? 0.22 : 0.5;
      renderer.toneMappingExposure = t === "light" ? 1.15 : 1.05;
      if (reduced) frame(performance.now());
    },
    dispose() {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", vis);
      removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); } });
      geos.forEach((g) => g.dispose());
      Object.values(M).forEach((m) => m.dispose());
      screenMat.dispose(); floorMat.dispose(); screenTex.dispose(); decalTex.dispose(); envTex.dispose(); pmrem.dispose();
      renderer.dispose();
    },
  };
  api.theme(theme);
  return api;
}
