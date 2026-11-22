import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";
import { DOING, ME, PROJECTS } from "../data";
import { FINE, REDUCED } from "../hooks/motion";
import useTheme from "../hooks/theme";
import Halftone from "./Halftone";
import Icon from "./Icons";

gsap.registerPlugin(ScrollTrigger, SplitText);

/*
  Home: the landing page at the plain site address (no #page in the URL).
  A 3D retro computer (components/Retro3D.js, three.js, loaded only here) fills the screen behind four
  liquid-glass cards. Scrolling moves the camera from the monitor to the keyboard (its keys fly in and snap
  into place), to the mouse, then back out; the CRT shows my halftone portrait and a terminal that types a
  little about me for each card. Real key presses press the 3D keys and type into the terminal (try `help`),
  clicking the screen opens the portfolio, the knob turns the CRT off and on.
  Motion, gsap.com style: inertial smooth scrolling (Lenis, driven by GSAP's ticker), headlines that rise in
  letter by letter (SplitText), cards that animate in and out with the scroll (ScrollTrigger), a giant line
  of text sliding behind the computer that leans with the scroll speed, springy magnetic buttons.
  Without WebGL the portrait is drawn flat (components/Halftone.jsx); with reduced motion nothing moves.
*/
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const WORDS = ["Build", "Ship", "Secure", "Scale"]; // "I love to …", one word at a time
const STEPS = ["Hello", "What I do", "Projects", "Let's talk"];
const MARQUEE = ["Java", "Spring Boot", "React", "PostgreSQL", "Docker", "Microservices"];
const expo = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

export default function Home({ go }) {
  const box = useRef(null);
  const story = useRef(null);
  const cv = useRef(null);
  const api = useRef(null);
  const lenis = useRef(null);
  const word = useRef(null);
  const wordSplit = useRef(null);
  const intro = useRef(null);
  const taps = useRef([]);
  const theme = useTheme();
  const [w, setW] = useState(0);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [flat, setFlat] = useState(false); // no WebGL: the flat portrait instead
  const name = `${ME.first[0]}${ME.first.slice(1).toLowerCase()}${ME.last.toLowerCase()}`;
  const city = ME.location?.split(",")[0] || "Bengaluru";
  const shown = PROJECTS.filter((p) => p.img).slice(0, 5);

  const openProject = (p) => (e) => {
    e?.preventDefault();
    history.pushState(null, "", `#projects/${slug(p.t)}`);
    dispatchEvent(new HashChangeEvent("hashchange"));
  };
  const open = (id) => (e) => (e.preventDefault(), go(id));

  useEffect(() => {
    document.documentElement.classList.add("home-mode");
    box.current?.focus({ preventScroll: true });
    return () => document.documentElement.classList.remove("home-mode");
  }, []);

  // ---- smooth scrolling: Lenis inside this page's own scroller, on GSAP's clock so scroll and animation agree
  useEffect(() => {
    if (REDUCED) return;
    const l = new Lenis({ wrapper: box.current, content: story.current, duration: 1.25, easing: expo, smoothWheel: true, touchMultiplier: 1.3 });
    lenis.current = l;
    l.on("scroll", ScrollTrigger.update);
    const tick = (t) => l.raf(t * 1000);
    gsap.ticker.add(tick);
    // GSAP keeps real time (no lag smoothing) so the scroll and every animation stay in step; the one long task,
    // building the 3D scene, finishes before the entrance starts (see below)
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      l.destroy();
      lenis.current = null;
    };
  }, []);

  // ---- the entrance and the scroll animations
  useLayoutEffect(() => {
    if (REDUCED) return;
    const scroller = box.current;
    const ctx = gsap.context(() => {
      const first = scroller.querySelector(".rt-step");
      const lead = SplitText.create(first.querySelector(".hm-lead"), { type: "words, chars", mask: "words", charsClass: "ch" });
      // paused in its start state until the 3D scene is built (or has failed), and after the intro curtain
      intro.current = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
        .from(".hm-nav", { y: -40, autoAlpha: 0, duration: 1.1 })
        .from(first.querySelector(".rt-card"), { y: 70, autoAlpha: 0, scale: 0.96, duration: 1.3 }, "<0.05")
        .from(lead.chars, { yPercent: 120, rotate: 10, duration: 1.1, stagger: 0.035 }, "<0.2")
        .from(first.querySelector(".hm-word"), { yPercent: 110, autoAlpha: 0, duration: 1 }, "<0.3")
        .from(first.querySelectorAll(".hm-kicker, .hm-text, .hm-ctas > *, .rt-hint"), { y: 26, autoAlpha: 0, filter: "blur(8px)", duration: 1, stagger: 0.08 }, "<0.05")
        .from(".rt-rail", { x: 40, autoAlpha: 0, duration: 1.1 }, "<");

      // cards 2-4 rise in as their step arrives, and rewind when you scroll back up
      gsap.utils.toArray(".rt-step", scroller).forEach((sec, i) => {
        const card = sec.querySelector(".rt-card"), float = sec.querySelector(".rt-float");
        if (i > 0) {
          const h = SplitText.create(card.querySelector(".rt-h"), { type: "words, chars", mask: "words", charsClass: "ch" });
          gsap.timeline({ scrollTrigger: { trigger: sec, scroller, start: "top 72%", toggleActions: "play none none reverse" }, defaults: { ease: "expo.out" } })
            .from(card, { y: 90, autoAlpha: 0, scale: 0.97, duration: 1.2 })
            .from(card.querySelector(".rt-num"), { x: -24, autoAlpha: 0, duration: 0.8 }, "<0.15")
            .from(h.chars, { yPercent: 120, rotate: 8, duration: 1, stagger: 0.022 }, "<0.05")
            .from(card.querySelectorAll(".rt-list li, .rt-projects li, .hm-text, .hm-ctas > *, .rt-foot, .rt-card > .hm-btn"), { y: 28, autoAlpha: 0, duration: 0.8, stagger: 0.06 }, "<0.2");
        }
        // every card drifts up and fades as its step scrolls away
        if (i < STEPS.length - 1) {
          gsap.to(float, { y: -110, autoAlpha: 0.15, ease: "none", scrollTrigger: { trigger: sec, scroller, start: "bottom 85%", end: "bottom 15%", scrub: true } });
        }
      });

      // the giant line of text behind the computer: slides with the scroll, leans with its speed
      const track = scroller.querySelector(".rt-mq-track");
      gsap.to(track, { xPercent: -50, ease: "none", scrollTrigger: { scroller, start: 0, end: "max", scrub: 1.2 } });
      const skew = gsap.quickTo(track, "skewX", { duration: 0.6, ease: "power3" });
      const lean = () => skew(gsap.utils.clamp(-14, 14, (lenis.current?.velocity || 0) * -0.35));
      gsap.ticker.add(lean);
      return () => gsap.ticker.remove(lean);
    }, box);
    return () => ctx.revert();
  }, []);

  // ---- the headline's last word: its letters flip out, the next word's flip in
  useLayoutEffect(() => {
    if (REDUCED || !word.current) return;
    // each letter rolls up into its own clipped slot (flat moves only: gradient text breaks under 3D rotation)
    const split = SplitText.create(word.current, { type: "chars", charsClass: "ch", mask: "chars" });
    wordSplit.current = split;
    const tw = gsap.from(split.chars, { yPercent: 115, rotate: 12, stagger: 0.045, duration: 0.85, ease: "back.out(1.8)", paused: w === 0 });
    if (w === 0) intro.current?.add(tw.play(), 0.55); // the first word joins the entrance timeline
    return () => { tw.kill(); split.revert(); };
  }, [w]);
  useEffect(() => {
    if (REDUCED) return;
    const t = setInterval(() => {
      const chars = wordSplit.current?.chars;
      if (!chars) return setW((v) => (v + 1) % WORDS.length);
      gsap.to(chars, { yPercent: -115, rotate: -8, stagger: 0.035, duration: 0.42, ease: "power3.in", onComplete: () => setW((v) => (v + 1) % WORDS.length) });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // ---- the 3D computer, loaded on its own (three.js only ever downloads for this page)
  useEffect(() => {
    let alive = true;
    const later = (fn) => setTimeout(fn, 650);
    const onCommand = (cmd) => {
      const nav = (id, line) => (later(() => go(id)), { out: [line] });
      if (cmd === "help") return { out: ["about · projects · skills · experience", "coding · contact · resume · whoami · clear"] };
      if (cmd === "clear") return { clear: true, out: [] };
      if (cmd === "ls") return { out: ["about/  projects/  skills/  contact/  resume.pdf"] };
      if (cmd === "whoami") return { out: [`${name.toLowerCase()} — ${ME.roles[0].toLowerCase()}`] };
      if (["about", "portfolio", "open", "open portfolio", "cd about"].includes(cmd)) return nav("about", "opening ~/portfolio …");
      if (["projects", "ls projects", "cd projects", "work"].includes(cmd)) return nav("projects", "opening ~/projects …");
      if (cmd === "skills") return nav("skills", "opening ~/skills …");
      if (cmd === "experience") return nav("experience", "opening ~/experience …");
      if (cmd === "coding") return nav("coding", "opening ~/coding …");
      if (["contact", "email", "mail", "hire", "sudo hire", "hire me"].includes(cmd)) return nav("contact", cmd.includes("hire") ? "permission granted ✔ opening contact …" : "opening ~/contact …");
      if (cmd === "resume") return (window.open(ME.resumes?.default || "/Guruprasad_P_updated.pdf", "_blank", "noopener"), { out: ["opening resume.pdf …"] });
      if (cmd.startsWith("sudo")) return { out: ["nice try. try `hire` instead"] };
      return null;
    };
    const script = [
      { cmd: "whoami", out: [`${name.toLowerCase()} — ${ME.roles[0].toLowerCase()}`, `${city.toLowerCase()} · ${ME.hiring[0].toLowerCase()}`] },
      { cmd: "cat skills.txt", out: DOING.map((d) => `› ${d.t.toLowerCase()}`) },
      { cmd: "ls ~/projects", out: shown.map((p) => `${slug(p.t)}/${p.demo ? "  ● live" : ""}`) },
      { cmd: "open portfolio", out: ["click this screen, or type `about`", "…or say hello: type `contact`"] },
    ];
    import("./Retro3D")
      .then(({ mountRetro }) => {
        if (!alive) return;
        try {
          api.current = mountRetro(cv.current, {
            portrait: "/me-ink.webp", name: name.toUpperCase(), role: ME.roles[0], script, onCommand,
            reduced: REDUCED, mobile: matchMedia("(max-width: 767px)").matches, theme: document.documentElement.dataset.theme,
          });
          setReady(true);
        } catch {
          setFlat(true); // WebGL unavailable
        }
      })
      .catch(() => alive && setFlat(true));
    return () => { alive = false; api.current?.dispose(); api.current = null; };
  }, []);
  useEffect(() => api.current?.theme(theme), [theme, ready]);
  // start the entrance once the 3D scene is ready (or failed, or after 3.5 s at most), never before the intro
  // curtain lifts (about 1.2 s after the page starts loading)
  useEffect(() => {
    const go = () => { const tl = intro.current; if (tl && !tl.isActive() && tl.progress() === 0) tl.delay(Math.max(0.1, 1.25 - performance.now() / 1000)).play(); };
    if (ready || flat) go();
    const t = setTimeout(go, 3500);
    return () => clearTimeout(t);
  }, [ready, flat]);

  // ---- scroll drives the camera; the rail shows which card is in view
  useEffect(() => {
    const el = box.current;
    const on = () => {
      const s = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
      api.current?.progress(s);
      setStep(Math.min(STEPS.length - 1, Math.round(s * (STEPS.length - 1))));
    };
    on();
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, [ready]);

  // ---- keyboard: the 3D keys go down, and typing goes to the CRT terminal
  useEffect(() => {
    const key = (e) => {
      if (e.target.closest?.("input, textarea, [contenteditable]") || document.querySelector('[aria-modal="true"]')) return;
      if (api.current?.key(e)) (e.preventDefault(), e.stopImmediatePropagation());
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, []);

  // ---- the interactive glass (mouse / trackpad): a light follows the pointer on the glass, cards tilt
  // toward it, buttons are pulled toward it and spring back when it leaves
  useEffect(() => {
    const el = box.current;
    if (!el || !FINE || REDUCED) return;
    const to = new WeakMap();
    const quick = (n) => {
      if (!to.has(n)) {
        const tilt = n.classList.contains("tilt");
        to.set(n, tilt
          ? { a: gsap.quickTo(n, "rotationY", { duration: 0.7, ease: "power3" }), b: gsap.quickTo(n, "rotationX", { duration: 0.7, ease: "power3" }), tilt }
          : { a: gsap.quickTo(n, "x", { duration: 0.5, ease: "power3" }), b: gsap.quickTo(n, "y", { duration: 0.5, ease: "power3" }), tilt });
        if (tilt) gsap.set(n, { transformPerspective: 1100 });
      }
      return to.get(n);
    };
    const release = (n) => n && gsap.to(n, n.classList.contains("tilt") ? { rotationX: 0, rotationY: 0, duration: 1.2, ease: "elastic.out(1, 0.45)", overwrite: "auto" } : { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.35)", overwrite: "auto" });
    let lastTilt = null, lastMag = null;
    const move = (e) => {
      const g = e.target.closest?.(".lg-glass");
      if (g) { const r = g.getBoundingClientRect(); g.style.setProperty("--gx", `${e.clientX - r.left}px`); g.style.setProperty("--gy", `${e.clientY - r.top}px`); }
      const t = e.target.closest?.(".tilt");
      if (t !== lastTilt) release(lastTilt);
      if (t) { const r = t.getBoundingClientRect(), q = quick(t); q.a(((e.clientX - r.left) / r.width - 0.5) * 7); q.b(((e.clientY - r.top) / r.height - 0.5) * -7); }
      lastTilt = t;
      const m = e.target.closest?.(".magnet");
      if (m !== lastMag) release(lastMag);
      if (m) { const r = m.getBoundingClientRect(), q = quick(m); q.a((e.clientX - r.left - r.width / 2) * 0.3); q.b((e.clientY - r.top - r.height / 2) * 0.4); }
      lastMag = m;
    };
    const leave = () => (release(lastTilt), release(lastMag), (lastTilt = lastMag = null));
    el.addEventListener("pointermove", move, { passive: true });
    el.addEventListener("pointerleave", leave);
    return () => (el.removeEventListener("pointermove", move), el.removeEventListener("pointerleave", leave));
  }, []);

  // a click on the 3D scene (not on a card): the screen opens the portfolio, the knob turns the CRT off / on
  const onClick = (e) => {
    if (e.target.closest("a, button, .rt-card, .hm-nav, .rt-rail")) return;
    if (api.current?.click(e) === "screen") go("about");
  };
  // the hidden way into the editor: 5 taps on the logo within 2 seconds
  const tap = (e) => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 2000), now];
    if (taps.current.length >= 5) (e.preventDefault(), location.assign("/admin/login"));
  };
  const toStep = (i) => {
    const sec = box.current.querySelectorAll(".rt-step")[i];
    if (lenis.current) lenis.current.scrollTo(sec, { duration: 1.6, easing: expo });
    else sec?.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
  };

  return (
    <div className="home" ref={box} tabIndex={-1} id="content" onClick={onClick}>
      <div className="ambient" aria-hidden="true"><i /><i /><i /></div>
      <div className="rt-marquee" aria-hidden="true">
        <div className="rt-mq-track">
          {[0, 1].map((k) => <span key={k}>{MARQUEE.map((m) => <b key={m}>{m}<i>✦</i></b>)}</span>)}
        </div>
      </div>
      <div className={`rt-stage ${ready ? "on" : ""}`} aria-hidden="true">
        <canvas ref={cv} className="rt-canvas" />
        {!ready && !flat && <p className="rt-boot">booting GP-26…</p>}
      </div>
      {flat && (
        <div className="rt-flat lg-glass" aria-hidden="true">
          <Halftone src="/me-ink.webp" step={4.6} ink={theme === "light" ? "#2a1712" : "#f3ead8"} edge={theme === "light" ? "#c2410c" : "#ffb27a"} className="rt-flat-art" />
        </div>
      )}

      <header className="hm-nav lg-glass">
        <a className="hm-brand" href="/" onClick={(e) => (e.preventDefault(), tap(e))} aria-label={`${name}, home`}>
          <span className="hm-logo" aria-hidden="true">{ME.initials}</span>
          <span className="hm-brand-name">{name}</span>
        </a>
        <nav className="hm-links" aria-label="Main">
          <a href="#projects" onClick={open("projects")}>Portfolio</a>
          <a href="#about" onClick={open("about")}>About</a>
          <a href="#contact" onClick={open("contact")} className="hm-boxed magnet">Contact</a>
        </nav>
      </header>

      <nav className="rt-rail lg-glass" aria-label="Sections of this page">
        {STEPS.map((l, i) => (
          <button key={l} className={step === i ? "on" : ""} onClick={() => toStep(i)} aria-label={l} aria-current={step === i ? "step" : undefined}>
            <span>{String(i).padStart(2, "0")}</span><i aria-hidden="true" /><b>{l}</b>
          </button>
        ))}
      </nav>

      <main className="rt-story" ref={story}>
        <section className="rt-step" aria-label="Hello">
          <div className="rt-float">
            <article className="rt-card lg-glass tilt">
              <p className="hm-kicker"><span className="hm-wave" aria-hidden="true">👋</span> I'm {name}, {ME.roles[0]}</p>
              <h1 className="hm-title">
                <span className="hm-lead">I love to</span>{" "}
                <span className="hm-word"><span key={w} ref={word}>{WORDS[w]}</span></span>
              </h1>
              <p className="hm-text">Spring Boot services that stay up, the React screens on top of them, and {ME.hiring[0].toLowerCase()}. Based in {city}.</p>
              <div className="hm-ctas">
                <a className="hm-btn magnet" href="#contact" onClick={open("contact")}>Contact me</a>
                <a className="hm-ghost magnet" href="#about" onClick={open("about")}>Open my portfolio <Icon name="next" size={16} /></a>
              </div>
              <p className="rt-hint"><span className="rt-mouse" aria-hidden="true" /> Scroll to put the computer together{FINE ? <> · type <kbd>help</kbd></> : null}</p>
            </article>
          </div>
        </section>

        <section className="rt-step" aria-label="What I do">
          <div className="rt-float">
            <article className="rt-card lg-glass tilt">
              <p className="rt-num">01 · ~/skills</p>
              <h2 className="rt-h">What I do.</h2>
              <ul className="rt-list">
                {DOING.map((d) => (
                  <li key={d.t}><span className="hm-ring" aria-hidden="true"><Icon name={d.icon} size={18} /></span><div><b>{d.t}</b><p>{d.d}</p></div></li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="rt-step" aria-label="Projects">
          <div className="rt-float">
            <article className="rt-card lg-glass tilt">
              <p className="rt-num">02 · ~/projects</p>
              <h2 className="rt-h">Things I've built.</h2>
              <ul className="rt-projects">
                {shown.map((p) => (
                  <li key={p.t}>
                    <a href={`#projects/${slug(p.t)}`} onClick={openProject(p)}>
                      <img src={p.img} alt="" loading="lazy" />
                      <span><b>{p.t}</b><small>{p.cat}{p.demo ? " · live" : ""}</small></span>
                      <Icon name="arrow" size={15} />
                    </a>
                  </li>
                ))}
              </ul>
              <a className="hm-btn magnet" href="#projects" onClick={open("projects")}>View all projects +</a>
            </article>
          </div>
        </section>

        <section className="rt-step" aria-label="Let's talk">
          <div className="rt-float">
            <article className="rt-card lg-glass tilt">
              <p className="rt-num">03 · ~/contact</p>
              <h2 className="rt-h">Let's build something.</h2>
              <p className="hm-text">{ME.hiring.join(" · ")}. I usually reply within a day.</p>
              <div className="hm-ctas">
                <a className="hm-btn magnet" href="#contact" onClick={open("contact")}>Contact me</a>
                <a className="hm-ghost magnet" href="#about" onClick={open("about")}>Open my portfolio <Icon name="next" size={16} /></a>
              </div>
              <p className="rt-foot">
                <a href={`mailto:${ME.email}`}>{ME.email}</a>
                {ME.socials.filter((s) => s.url && !s.url.startsWith("/")).map((s) => <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>)}
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
