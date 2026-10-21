import { useRef, useState } from "react";
import { ABOUT, ME } from "../data";
import { FINE, REDUCED } from "../hooks/motion";

// the photo as WebP (about a third smaller); index.html preloads it so the header shows first
const WEBP = ABOUT.photo?.endsWith(".jpg") ? ABOUT.photo.replace(/\.jpg$/, ".webp") : undefined;

/*
  Profile photo as an old camcorder feed: a rotating gradient ring, a CRT power-on reveal,
  a scanline sweep and a blinking REC badge. It tilts toward the cursor and glitches on hover / tap.
*/
export default function Avatar({ name }) {
  const ref = useRef(null);
  const [glitch, setGlitch] = useState(0);
  const [failed, setFailed] = useState(false);
  const photo = ABOUT.photo && !failed;

  const move = (e) => {
    if (!FINE || REDUCED) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(600px) rotateY(${px * 22}deg) rotateX(${-py * 22}deg) scale(1.04)`;
  };

  return (
    <figure
      className="avatar-box"
      ref={ref}
      onMouseMove={move}
      onMouseEnter={() => setGlitch((n) => n + 1)}
      onMouseLeave={() => (ref.current.style.transform = "")}
      onClick={() => setGlitch((n) => n + 1)}
    >
      <span className="avatar-ring" aria-hidden="true" />
      <span className="avatar-frame">
        {photo ? (
          <>
            <img className="avatar-img" src={ABOUT.photo} srcSet={WEBP} alt={name} fetchpriority="high" onError={(e) => (e.currentTarget.srcset ? e.currentTarget.removeAttribute("srcset") : setFailed(true))} />
            <img className={`avatar-ghost ${glitch ? "go" : ""}`} key={glitch} src={ABOUT.photo} srcSet={WEBP} alt="" aria-hidden="true" />
          </>
        ) : (
          <span className="mono">{ME.initials}</span>
        )}
        <span className="avatar-sweep" aria-hidden="true" />
      </span>
      <span className="avatar-rec" aria-hidden="true"><i />REC</span>
    </figure>
  );
}
