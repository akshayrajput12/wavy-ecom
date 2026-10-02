import { Fragment, memo, type ReactNode } from "react";
import { CX, CY, EYES, FAR, buildHairs, buildStripes, edgeShapes, pathD, type Pt } from "./tearGeometry";

/**
 * SVG pieces for TearReveal. Colours are illustration tokens (--art-*) set via style, since var() in SVG attributes is
 * unreliable. Everything here renders once; TearReveal moves it afterwards through the `data-tr` hooks.
 */
const c = (v: string) => ({ fill: `var(${v})` });
const stop = (v: string, opacity?: number) => ({ stopColor: `var(${v})`, stopOpacity: opacity });

// An almond eye: sharp outer corner, inner corner dipping toward the nose (right eye; the left one is mirrored).
const ALMOND = "M-78 10 C-52 -40 30 -56 80 -8 C44 40 -30 50 -78 10Z";
/** The tiger at rest. Its rise (a small lift and zoom) is a CSS transform on the layer around it. */
export const TIGER_SCALE = 1.28;
const TIGER = `translate(${CX} ${CY}) rotate(-7) scale(${TIGER_SCALE})`;

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
      {/* ponytail: the noise is limited to the part of the face any screen up to ~3:1 shows; stripes past it stay crisp */}
      <filter id={id + "-rough"} filterUnits="userSpaceOnUse" x="-760" y="-340" width="1520" height="680">
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

/** The heavy part (2600 hairs, stripes, filters). Never changes, so its layer is painted once. */
export const Fur = memo(function Fur({ id }: { id: string }) {
  const rect = { x: -2600, y: -420, width: 5200, height: 840 };
  return (
    <g transform={TIGER}>
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

/** What the eye loop animates. */
export type EyePose = { look: Pt; blink: number; pupil: number; scale: number };

/** Both eyes, glowing. Each frame only the small `data-tr` groups inside are touched. */
export function Eyes({ id, pose, fibres }: { id: string; pose: EyePose; fibres: string }) {
  return (
    <g transform={TIGER}>
      <g filter={`url(#${id}-glow)`}>
        {EYES.map(([x, y], i) => <Eye key={i} id={id} x={x} y={y} flip={i === 0} pose={pose} fibres={fibres} />)}
      </g>
    </g>
  );
}

const eyeAt = (x: number, y: number, flip: boolean, scale: number) => `translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`;
/** The per-frame attributes of one eye, shared by the first render and the eye loop. */
export function eyeAttrs([x, y]: Pt, flip: boolean, { look, blink, pupil, scale }: EyePose) {
  return {
    eye: eyeAt(x, y, flip, scale),
    iris: `translate(${(look[0] * (flip ? -13 : 13)).toFixed(2)} ${(4 + look[1] * 7).toFixed(2)})`,
    lid: `translate(0 ${(-62 + blink * 72).toFixed(2)})`,
    pupil: (13 * pupil).toFixed(2),
  };
}

function Eye({ id, x, y, flip, pose, fibres }: { id: string; x: number; y: number; flip: boolean; pose: EyePose; fibres: string }) {
  const clip = id + (flip ? "-cl" : "-cr");
  const a = eyeAttrs([x, y], flip, pose);
  const skin = { fill: "var(--art-skin)", stroke: "var(--art-skin)" };
  return (
    <g data-tr="eye" transform={a.eye}>
      <clipPath id={clip}><path d={ALMOND} /></clipPath>
      <path d={ALMOND} style={skin} strokeWidth={11} strokeLinejoin="round" />
      <path d="M-80 8 C-86 20 -96 30 -98 44 C-90 34 -80 24 -70 18Z" style={c("--art-skin")} />
      <g clipPath={`url(#${clip})`}>
        <ellipse cx={0} cy={0} rx={80} ry={52} style={c("--art-sclera")} />
        <g data-tr="iris" transform={a.iris}>
          <circle r={38} fill={`url(#${id}-iris)`} />
          <path d={fibres} style={{ stroke: "var(--art-iris-fibre)" }} strokeWidth={1} opacity={0.35} />
          <circle r={38} fill="none" style={{ stroke: "var(--art-iris-edge)" }} strokeWidth={3} opacity={0.8} />
          <circle data-tr="pupil" r={a.pupil} style={c("--art-skin")} />
          <ellipse cx={-12} cy={-13} rx={7.5} ry={5.5} style={c("--art-glint")} opacity={0.92} />
          <circle cx={9} cy={10} r={2.6} style={c("--art-glint")} opacity={0.6} />
        </g>
        {/* the upper lid's shadow, and the lid itself when it closes */}
        <ellipse cx={0} cy={-46} rx={90} ry={34} fill={`url(#${id}-lid)`} />
        <g data-tr="lid" transform={a.lid}>
          <rect x={-90} y={-80} width={180} height={80} style={c("--art-lid")} />
          <path d="M-90 0 H90" style={{ stroke: "var(--art-skin)" }} strokeWidth={8} />
        </g>
      </g>
    </g>
  );
}

/**
 * One part of a torn half of the sheet, back to front: the shadow it casts into the gap, the sheet clipped to its side
 * of the tear, and the torn edge (pale core and curls). Each part is its own layer: where the half sits is a CSS
 * transform on all three, and only the thin shadow and edge reshape (early on), so the sheet and word never repaint.
 */
export function Half({ id, side, line, open, part, children }: {
  id: string; side: "top" | "bottom"; line: Pt[]; open: number; part: "shadow" | "sheet" | "edge"; children?: ReactNode;
}) {
  const up = side === "top";
  const edge = edgeShapes(side, line, open);
  if (part === "shadow") {
    return (
      <path data-tr="shadow" d={pathD(line, false)} fill="none" style={{ stroke: "var(--black)" }} strokeOpacity={edge.shadow}
        strokeWidth={22} transform={`translate(0 ${up ? 10 : -10})`} filter={`url(#${id}-soft)`} />
    );
  }
  if (part === "edge") {
    return (
      <>
        <path data-tr="core" d={edge.core} style={c("--surface")} />
        {edge.curls.map((d, i) => <path key={i} data-tr="curl" d={d} fill={`url(#${id}-curl-${side})`} style={{ stroke: "var(--surface)" }} strokeWidth={1} />)}
      </>
    );
  }
  const first = line[0][0];
  const last = line[line.length - 1][0];
  const shape: Pt[] = up ? [[first, -FAR], [last, -FAR], ...[...line].reverse()] : [...line, [last, FAR], [first, FAR]];
  const clip = `${id}-${side}`;
  return (
    <>
      <clipPath id={clip}><path d={pathD(shape)} /></clipPath>
      <g clipPath={`url(#${clip})`}>{children}</g>
    </>
  );
}
