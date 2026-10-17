import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { JOURNEY_MAP } from "../data";
import { REDUCED } from "../hooks/motion";
import useInView from "../hooks/useInView";

/*
  True-to-scale map of coastal and southern Karnataka (equirectangular: a degree of longitude is
  cos(latitude) as wide as a degree of latitude), so every stop sits where it really is.
*/
const W = 600, H = 280;
const WEST = 74.35, NORTH = 13.95, KX = W / 3.5; // 74.35°E – 77.85°E across the width
const KY = KX / Math.cos((13.2 * Math.PI) / 180);
const xy = (lat, lon) => [+((lon - WEST) * KX).toFixed(1), +((NORTH - lat) * KY).toFixed(1)];

// Coastline traced through real coastal towns, north to south: Bhatkal, Byndoor, Kundapura, Malpe,
// Kaup, Padubidri, Surathkal, Mangaluru, Ullal, Manjeshwar, Kasaragod, Kanhangad.
const COAST = [[13.98, 74.56], [13.87, 74.63], [13.62, 74.67], [13.35, 74.69], [13.22, 74.745], [13.14, 74.765], [12.99, 74.78], [12.87, 74.82], [12.8, 74.845], [12.71, 74.885], [12.5, 74.98], [12.31, 75.08]].map(([la, lo]) => xy(la, lo));
const SEA = `M0 0 L${COAST.map(([x, y]) => `${x} ${y}`).join(" L")} L0 ${H} Z`;
const SHORE = `M${COAST.map(([x, y]) => `${x} ${y}`).join(" L")}`;
const MANGALURU = xy(12.8698, 74.843); // reference dot for orientation
// Western Ghats crest runs roughly along 75.3°E – 75.7°E here
const GHATS = [[13.75, 75.3], [13.35, 75.45], [12.95, 75.55], [12.6, 75.7]].map(([la, lo]) => xy(la, lo));

const pts = JOURNEY_MAP.map((s) => xy(s.lat, s.lon));
// A gentle curve through every stop; the long leg arcs up over the Ghats.
const legs = pts.slice(1).map(([x, y], i) => {
  const [px, py] = pts[i];
  const d = Math.hypot(x - px, y - py);
  return { d, c: [(px + x) / 2, Math.min(py, y) - Math.min(90, d * 0.3)], to: [x, y] };
});
const route = legs.reduce((p, l) => `${p} Q${l.c[0].toFixed(1)} ${l.c[1].toFixed(1)} ${l.to[0]} ${l.to[1]}`, `M${pts[0][0]} ${pts[0][1]}`);
// When the drawing line reaches each stop (fraction of the whole route), so its pin pops in on time.
const total = legs.reduce((n, l) => n + l.d, 0);
const reach = pts.map((_, i) => legs.slice(0, i).reduce((n, l) => n + l.d, 0) / total);
const DRAW = 2.4; // seconds the route takes to draw
// the route is drawn with ease-in-out, so convert distance fraction → time fraction (inverse smoothstep, close enough)
const timeAt = (f) => 0.5 - Math.sin(Math.asin(1 - 2 * f) / 3);

// Animated route from school to work: the line draws itself, each stop pops in as the line reaches it,
// and a small traveller dot follows the path.
export default function JourneyMap() {
  const ref = useRef(null);
  const trip = useRef(null);
  const seen = useInView(ref, 0.35);
  const go = seen || REDUCED;

  useEffect(() => {
    if (seen && !REDUCED) trip.current?.beginElement?.();
  }, [seen]);

  return (
    <figure className="jmap" ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Map of my journey: ${JOURNEY_MAP.map((s) => s.n).join(" → ")}`}>
        <defs>
          <linearGradient id="jroute" x1="0" x2="1">
            <stop offset="0" stopColor="var(--signal)" />
            <stop offset="1" stopColor="var(--ember)" />
          </linearGradient>
        </defs>
        <path className="jmap-sea" d={SEA} />
        <path className="jmap-shore" d={SHORE} />
        <text className="jmap-label sea" x="10" y={H - 14}>Arabian Sea</text>
        <path className="jmap-ghats" d={GHATS.map(([x, y]) => `M${x - 11} ${y + 8} l11 -16 l11 16`).join(" ")} />
        <text className="jmap-label" x={GHATS[2][0] + 22} y={GHATS[2][1] + 52}>Western Ghats</text>
        <circle className="jmap-ref" cx={MANGALURU[0]} cy={MANGALURU[1]} r="3.5" />
        <text className="jmap-label" x={MANGALURU[0] + 6} y={MANGALURU[1] + 28}>Mangaluru</text>

        <path className="jmap-ghost" d={route} />
        <motion.path
          className="jmap-route"
          d={route}
          stroke="url(#jroute)"
          initial={{ pathLength: REDUCED ? 1 : 0 }}
          animate={{ pathLength: go ? 1 : 0 }}
          transition={{ duration: REDUCED ? 0 : DRAW, ease: [0.65, 0, 0.35, 1] }}
        />
        {!REDUCED && (
          <circle className="jmap-traveller" r="5" opacity={seen ? 1 : 0}>
            <animateMotion ref={trip} dur={`${DRAW}s`} begin="indefinite" fill="freeze" path={route} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.65 0 0.35 1" />
          </circle>
        )}

        {pts.map(([x, y], i) => {
          const s = JOURNEY_MAP[i];
          const [dx, dy, anchor] = s.lbl || [14, -14, "start"];
          return (
            <motion.g
              key={s.n}
              initial={{ opacity: REDUCED ? 1 : 0, scale: REDUCED ? 1 : 0.3 }}
              animate={go ? { opacity: 1, scale: 1 } : {}}
              transition={{ type: "spring", stiffness: 420, damping: 16, delay: REDUCED ? 0 : DRAW * timeAt(reach[i]) }}
              style={{ transformOrigin: `${x}px ${y}px` }}
            >
              <path className="jmap-leader" d={`M${x} ${y} L${x + dx * 0.8} ${y + dy * 0.8 + (dy < 0 ? 4 : -14)}`} />
              <circle className="jmap-pulse" cx={x} cy={y} r="12" />
              <circle className="jmap-pin" cx={x} cy={y} r="6" />
              <text className="jmap-num" x={x} y={y + 0.5}>{i + 1}</text>
              <text className="jmap-name" x={x + dx} y={y + dy} textAnchor={anchor}>{s.n}</text>
            </motion.g>
          );
        })}
      </svg>
      <figcaption>
        <ol className="jmap-legend">
          {JOURNEY_MAP.map((s, i) => (
            <li key={s.n} style={{ "--i": i }}>
              <b>{s.n}</b>
              <span>{s.d}</span>
              <small>{s.yrs}</small>
            </li>
          ))}
        </ol>
      </figcaption>
    </figure>
  );
}
