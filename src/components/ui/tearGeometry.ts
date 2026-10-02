/**
 * Pure math and deterministic art for TearReveal: the scroll beats, the tear line, how the halves move,
 * and the seeded tiger paths (stripes, hairs, iris fibres). Same output every visit, no DOM.
 */
export type Pt = [number, number];

export const VIEW_W = 1000;
export const CX = 500;
export const CY = 318;
/** The paper halves reach well past any screen. */
export const FAR = 4000;
/** Visible frame (viewBox units), cropped to the artwork. The word is narrower than it (see TearReveal), so it never meets the edge. */
export const FRAME_W = 928;
export const FRAME_H = 468;
const FRAME_X = CX - FRAME_W / 2;
const FRAME_Y = 44;
/** The frame grown about its centre: a layer `grow` times the stage's size with this viewBox maps 1:1 onto the stage. */
export function viewBox(grow = 1) {
  const w = FRAME_W * grow;
  const h = FRAME_H * grow;
  return [FRAME_X - (w - FRAME_W) / 2, FRAME_Y - (h - FRAME_H) / 2, w, h].map((n) => +n.toFixed(2)).join(" ");
}
/** How far the tear's pivot (CX, CY) sits below the frame's centre, in viewBox units. */
export const PIVOT_DY = CY - (FRAME_Y + FRAME_H / 2);
export const EYES: Pt[] = [[-138, 6], [138, -4]];
/** How far the halves travel off-screen in the image variant (viewBox units; clears a 375px portrait screen). */
const CLEAR = 1400;

/** Seeded PRNG (mulberry32), so the tear and the fur are the same every visit. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp01 = (x: number) => (x <= 0 ? 0 : x > 1 ? 1 : x);

export function smooth(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Overshoot ease: the eyes open a little too wide, then settle. */
export function easeOutBack(t: number) {
  const c = 1.70158;
  const u = clamp01(t) - 1;
  return 1 + (c + 1) * u * u * u + c * u * u;
}

/** How far through the pinned scroll we are: 0 when the section top meets the viewport top, 1 when the stage lets go. */
export function scrollProgress(top: number, height: number, viewport: number) {
  const range = height - viewport;
  if (range <= 0) return top <= 0 ? 1 : 0;
  return clamp01(-top / range);
}

/** One scroll value drives every beat. `clear` (image variant) carries the halves off-screen after they part. */
export function stages(p: number) {
  return {
    crack: smooth(0.03, 0.2, p), // a crack runs out from the middle of the word
    open: smooth(0.18, 0.62, p), // the sheet tears and the halves pull apart
    rise: smooth(0.26, 0.74, p), // the tiger comes up from behind
    pop: smooth(0.58, 0.88, p), // and opens its eyes
    clear: smooth(0.6, 0.92, p), // image variant: the halves leave the frame
    shake: smooth(0.16, 0.22, p) * (1 - smooth(0.26, 0.36, p)), // the jolt of the rip
  };
}

/** The tear, left to right across the whole sheet: a slight rising diagonal, a slow wander, fibres, the odd tooth. */
export function tearLine(seed = 11, from = -800, to = 1800, step = 9, angle = -7): Pt[] {
  const r = rng(seed);
  const slope = Math.tan((angle * Math.PI) / 180);
  const out: Pt[] = [];
  for (let x = from; x <= to; x += step) {
    const fibre = (r() - 0.5) * 5;
    const tooth = r() < 0.09 ? (r() - 0.5) * 26 : 0;
    const wander = Math.sin(x * 0.019 + seed) * 10 + Math.sin(x * 0.053 + seed * 2) * 4;
    out.push([x, CY + (x - CX) * slope + wander + fibre + tooth]);
  }
  return out;
}

/** Where each half goes as the tear opens (and, for the image variant, clears). Both still at 0. */
export function pieceMotion(open: number, clear = 0) {
  return {
    top: { dx: -10 * open, dy: -82 * open - CLEAR * clear, rot: -2.6 * open },
    bottom: { dx: 12 * open, dy: 78 * open + CLEAR * clear, rot: 2.1 * open },
  };
}

/** Width of the pale paper core exposed along a torn edge. */
export function fibreWidths(n: number, open: number, seed = 5) {
  const r = rng(seed);
  const k = Math.min(1, open * 4);
  return Array.from({ length: n }, (_, i) => k * (2.5 + 6 * (0.5 + 0.5 * Math.sin(i * 0.37 + seed)) * (0.6 + r() * 0.8)));
}

export const pathD = (pts: Pt[], close = true) =>
  "M" + pts.map(([x, y]) => x.toFixed(1) + " " + y.toFixed(1)).join("L") + (close ? "Z" : "");

// Where the paper curls back over the gap: [x along the tear, half-width, depth].
const CURLS: Record<"top" | "bottom", [number, number, number][]> = {
  top: [[300, 44, 30], [575, 30, 20], [790, 52, 34]],
  bottom: [[205, 50, 32], [470, 34, 22], [690, 40, 28]],
};
/** Past this much `open` a torn edge (core, curls, shadow) stops changing, so the halves only move. */
export const EDGE_DONE = 0.4;

/** A torn edge at `open`: the pale paper core along it, the curls, and the cast shadow's strength. */
export function edgeShapes(side: "top" | "bottom", line: Pt[], open: number) {
  const up = side === "top";
  const o = Math.min(open, EDGE_DONE);
  const k = o / EDGE_DONE;
  const widths = fibreWidths(line.length, o, up ? 5 : 8);
  const core = pathD(line.concat(line.map(([x, y], i): Pt => [x, y + (up ? -widths[i] : widths[i])]).reverse()));
  const curls = CURLS[side].map(([cx, hw, depth]) => {
    const pts = line.filter(([x]) => Math.abs(x - cx) <= hw);
    const back = pts.map(([x, y]): Pt => {
      const c = Math.cos(((x - cx) / hw) * (Math.PI / 2));
      return [x + (up ? 6 : -6) * c * k, y + (up ? 1 : -1) * depth * c * c * k];
    });
    return pathD(pts.concat(back.reverse()));
  });
  return { core, curls, shadow: 0.55 * Math.min(1, o * 3) };
}

/** A stripe: a quadratic spine with a width that tapers to points at both ends. */
function stripe(p0: Pt, p1: Pt, p2: Pt, w: number, n = 18) {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const m = 1 - t;
    const x = m * m * p0[0] + 2 * m * t * p1[0] + t * t * p2[0];
    const y = m * m * p0[1] + 2 * m * t * p1[1] + t * t * p2[1];
    const dx = 2 * m * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    const dy = 2 * m * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const l = Math.hypot(dx, dy) || 1;
    const h = (w / 2) * Math.pow(Math.sin(Math.PI * t), 0.6);
    left.push([x - (dy / l) * h, y + (dx / l) * h]);
    right.push([x + (dy / l) * h, y - (dx / l) * h]);
  }
  return pathD(left.concat(right.reverse()));
}

/** The face's stripes, and the body stripes running off both sides. */
export function buildStripes() {
  const r = rng(29);
  const j = (a: number) => (r() - 0.5) * a;
  const out: string[] = [];
  for (const k of [-2, -1, 0, 1, 2]) {
    out.push(stripe([k * 27 + j(8), -205], [k * 21 + j(6), -140], [k * 11, -72 + Math.abs(k) * 10], 13 - Math.abs(k) * 2));
  }
  for (const s of [-1, 1]) {
    out.push(stripe([s * 50, -108], [s * 138, -140 + j(8)], [s * 228, -96], 13));
    out.push(stripe([s * 72, -158], [s * 150, -188 + j(8)], [s * 250, -150], 11));
    for (const y of [-160, -104, -48, 14, 76, 138]) {
      out.push(stripe([s * 350, y + j(10)], [s * 292, y + j(26)], [s * (222 + r() * 30), y + j(34)], 18 + r() * 8));
    }
    out.push(stripe([s * 212, 38], [s * 256, 72], [s * 330, 98], 14));
    out.push(stripe([s * 182, 74], [s * 226, 120], [s * 312, 156], 12));
    out.push(stripe([s * 64, 22], [s * 50, 88], [s * 42, 178], 8));
    for (let k = 0; k < 16; k++) {
      const x = s * (390 + k * 70 + j(30));
      out.push(stripe([x + j(40), -330], [x + s * 30 + j(40), j(60)], [x + s * 10 + j(40), 330], 20 + r() * 14));
    }
  }
  return out.join("");
}

/** Short hairs flowing outward from the nose, in three tones. */
export function buildHairs() {
  const r = rng(53);
  const tones = ["", "", ""];
  for (let i = 0; i < 2600; i++) {
    const x = (r() - 0.5) * 1900;
    const y = (r() - 0.5) * 480;
    const a = Math.atan2(y - 150, x) + (r() - 0.5) * 0.5;
    const l = 9 + r() * 12;
    tones[r() < 0.45 ? 0 : r() < 0.7 ? 1 : 2] +=
      "M" + x.toFixed(1) + " " + y.toFixed(1) + "l" + (Math.cos(a) * l).toFixed(1) + " " + (Math.sin(a) * l).toFixed(1);
  }
  return tones;
}

/** Fine radial fibres in an iris. */
export function buildFibres() {
  const r = rng(71);
  let s = "";
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2 + r() * 0.08;
    const r0 = 12 + r() * 4;
    const r1 = 30 + r() * 5;
    s += "M" + (Math.cos(a) * r0).toFixed(1) + " " + (Math.sin(a) * r0).toFixed(1) + "L" + (Math.cos(a) * r1).toFixed(1) + " " + (Math.sin(a) * r1).toFixed(1);
  }
  return s;
}
