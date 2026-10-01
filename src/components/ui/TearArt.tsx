import { Fragment, memo, type ReactNode } from "react";
import { CX, CY, EYES, FAR, buildHairs, buildStripes, fibreWidths, pathD, pieceMotion, type Pt } from "./tearGeometry";

/** SVG pieces for TearReveal. Colours are illustration tokens (--art-*) set via style, since var() in SVG attributes is unreliable. */
const c = (v: string) => ({ fill: `var(${v})` });
const stop = (v: string, opacity?: number) => ({ stopColor: `var(${v})`, stopOpacity: opacity });

// An almond eye: sharp outer corner, inner corner dipping toward the nose (right eye; the left one is mirrored).
const ALMOND = "M-78 10 C-52 -40 30 -56 80 -8 C44 40 -30 50 -78 10Z";

export function ArtDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id + "-shade"} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={stop("--art-shade", 0.45)} />
        <stop offset="0.45" style={stop("--art-sheen", 0.12)} />
        <stop offset="1" style={stop("--art-shade", 0.5)} />
      </linearGradient>
      <radialGradient id={id + "-vignette"} cx="0.5" cy="0.5" r="0.5" gradientTransform="translate(0.5 0.5) scale(0.25 1) translate(-0.5 -0.5)">
        <stop offset="0.5" style={stop("--art-shade", 0)} />
        <stop offset="1" style={stop("--art-shade", 0.55)} />
      </radialGradient>
      <radialGradient id={id + "-iris"}>
        <stop offset="0" style={stop("--art-iris-core")} />
        <stop offset="0.35" style={stop("--art-iris")} />
        <stop offset="0.8" style={stop("--art-iris-mid")} />
        <stop offset="1" style={stop("--art-iris-edge")} />
      </radialGradient>
      <linearGradient id={id + "-lid"} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style={stop("--black", 0.75)} />
        <stop offset="1" style={stop("--black", 0)} />
      </linearGradient>
      {(["top", "bottom"] as const).map((side) => (
        <linearGradient key={side} id={`${id}-curl-${side}`} x1="0" y1={side === "top" ? 0 : 1} x2="0" y2={side === "top" ? 1 : 0}>
          <stop offset="0" style={stop("--surface")} />
          <stop offset="1" style={stop("--line")} />
        </linearGradient>
      ))}
      <filter id={id + "-soft"} x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="8" /></filter>
      <filter id={id + "-rough"} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="9" />
      </filter>
      <filter id={id + "-glow"} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="9" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
  );
}

// Deterministic, so built once per page load.
const STRIPES = buildStripes();
const HAIRS = buildHairs();

/** The heavy part (2600 hairs + stripes): memoized so per-frame renders skip it. */
export const Fur = memo(function Fur({ id }: { id: string }) {
  const rect = { x: -2600, y: -420, width: 5200, height: 840 };
  return (
    <g>
      <rect {...rect} style={c("--art-fur")} />
      <rect {...rect} fill={`url(#${id}-shade)`} />
      <rect {...rect} fill={`url(#${id}-vignette)`} />
      <g filter={`url(#${id}-soft)`} style={c("--art-fur-light")}>
        {EYES.map(([x, y], i) => (
          <Fragment key={i}>
            <ellipse cx={x} cy={y - 52} rx={78} ry={22} />
            <ellipse cx={x} cy={y + 44} rx={64} ry={15} opacity={0.9} />
          </Fragment>
        ))}
        <ellipse cx={0} cy={188} rx={96} ry={52} opacity={0.85} />
      </g>
      <g filter={`url(#${id}-rough)`}><path d={STRIPES} style={c("--art-stripe")} /></g>
      <path d={HAIRS[0]} style={{ stroke: "var(--art-hair-dark)" }} strokeWidth={1.4} opacity={0.35} strokeLinecap="round" />
      <path d={HAIRS[1]} style={{ stroke: "var(--art-hair-gold)" }} strokeWidth={1.2} opacity={0.35} strokeLinecap="round" />
      <path d={HAIRS[2]} style={{ stroke: "var(--art-hair-light)" }} strokeWidth={1} opacity={0.22} strokeLinecap="round" />
    </g>
  );
});

export function Eye({ id, x, y, flip, look, blink, pupil, scale, fibres }: {
  id: string; x: number; y: number; flip: boolean; look: Pt; blink: number; pupil: number; scale: number; fibres: string;
}) {
  const clip = id + (flip ? "-cl" : "-cr");
  const lx = look[0] * (flip ? -1 : 1);
  const skin = { fill: "var(--art-skin)", stroke: "var(--art-skin)" };
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      <clipPath id={clip}><path d={ALMOND} /></clipPath>
      <path d={ALMOND} style={skin} strokeWidth={11} strokeLinejoin="round" />
      <path d="M-80 8 C-86 20 -96 30 -98 44 C-90 34 -80 24 -70 18Z" style={c("--art-skin")} />
      <g clipPath={`url(#${clip})`}>
        <ellipse cx={0} cy={0} rx={80} ry={52} style={c("--art-sclera")} />
        <g transform={`translate(${(lx * 13).toFixed(2)} ${(4 + look[1] * 7).toFixed(2)})`}>
          <circle r={38} fill={`url(#${id}-iris)`} />
          <path d={fibres} style={{ stroke: "var(--art-iris-fibre)" }} strokeWidth={1} opacity={0.35} />
          <circle r={38} fill="none" style={{ stroke: "var(--art-iris-edge)" }} strokeWidth={3} opacity={0.8} />
          <circle r={13 * pupil} style={c("--art-skin")} />
          <ellipse cx={-12} cy={-13} rx={7.5} ry={5.5} style={c("--art-glint")} opacity={0.92} />
          <circle cx={9} cy={10} r={2.6} style={c("--art-glint")} opacity={0.6} />
        </g>
        {/* the upper lid's shadow, and the lid itself when it closes */}
        <ellipse cx={0} cy={-46} rx={90} ry={34} fill={`url(#${id}-lid)`} />
        <g transform={`translate(0 ${(-62 + blink * 72).toFixed(2)})`}>
          <rect x={-90} y={-80} width={180} height={80} style={c("--art-lid")} />
          <path d="M-90 0 H90" style={{ stroke: "var(--art-skin)" }} strokeWidth={8} />
        </g>
      </g>
    </g>
  );
}

// Where the paper curls back over the gap: [x along the tear, half-width, depth].
const CURLS: Record<"top" | "bottom", [number, number, number][]> = {
  top: [[300, 44, 30], [575, 30, 20], [790, 52, 34]],
  bottom: [[205, 50, 32], [470, 34, 22], [690, 40, 28]],
};

/** One torn half of the sheet: the sheet clipped to its side of the tear, with a pale core, curls and a cast shadow. */
export function Half({ id, side, line, open, clear, children }: {
  id: string; side: "top" | "bottom"; line: Pt[]; open: number; clear: number; children: ReactNode;
}) {
  const up = side === "top";
  const m = pieceMotion(open, clear)[side];
  const first = line[0][0];
  const last = line[line.length - 1][0];
  const shape: Pt[] = up ? [[first, -FAR], [last, -FAR], ...[...line].reverse()] : [...line, [last, FAR], [first, FAR]];
  const widths = fibreWidths(line.length, open, up ? 5 : 8);
  const core = line.concat(line.map(([x, y], i): Pt => [x, y + (up ? -widths[i] : widths[i])]).reverse());
  const curls = CURLS[side].map(([cx, hw, depth]) => {
    const pts = line.filter(([x]) => Math.abs(x - cx) <= hw);
    const back = pts.map(([x, y]): Pt => {
      const s = Math.cos(((x - cx) / hw) * (Math.PI / 2));
      return [x + (up ? 6 : -6) * s * open, y + (up ? 1 : -1) * depth * s * s * Math.min(1, open * 2.5)];
    });
    return pathD(pts.concat(back.reverse()));
  });
  const clip = `${id}-${side}`;
  return (
    <g transform={`translate(${m.dx.toFixed(2)} ${m.dy.toFixed(2)}) rotate(${m.rot.toFixed(3)} ${CX} ${CY})`}>
      <path d={pathD(line, false)} fill="none" style={{ stroke: "var(--black)" }} strokeOpacity={0.55 * Math.min(1, open * 3)}
        strokeWidth={22} transform={`translate(0 ${up ? 10 : -10})`} filter={`url(#${id}-soft)`} />
      <clipPath id={clip}><path d={pathD(shape)} /></clipPath>
      <g clipPath={`url(#${clip})`}>{children}</g>
      <path d={pathD(core)} style={c("--surface")} />
      {curls.map((d, i) => <path key={i} d={d} fill={`url(#${id}-curl-${side})`} style={{ stroke: "var(--surface)" }} strokeWidth={1} />)}
    </g>
  );
}
