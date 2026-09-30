/**
 * Pure garment-fit math. Given pose landmarks (normalized 0..1, MediaPipe Pose indices),
 * compute a 2D affine transform that maps the garment image onto the body.
 *
 * The garment image lives in "unit space": x in [-0.5, 0.5] (left→right edge), y in [0, 1]
 * (top edge→bottom edge). Draw it with:
 *   ctx.setTransform(...fit.matrix); ctx.drawImage(img, -0.5, 0, 1, 1);
 *
 * X axis follows the shoulder (or hip) line, Y axis follows the torso (or legs), so the matrix
 * carries position, scale, rotation AND shear — shear is the cheap stand-in for perspective when
 * the user leans or turns slightly.
 */

export type GarmentType = "top" | "bottom";

export interface Landmark { x: number; y: number; visibility?: number }

export interface Calibration {
  /** Garment image width as a multiple of shoulder (top) or hip (bottom) width. */
  widthScale: number;
  /** Garment image height as a multiple of the anchor length (shoulder→hip, or hip→knee/ankle). */
  lengthScale: number;
  /** Shift along the body axis, in anchor lengths. Negative raises the garment (e.g. collar above shoulders). */
  offsetY: number;
  /** Shift along the shoulder/hip line, in widths. */
  offsetX: number;
  /** Bottoms only: measure length to knees (shorts) or ankles (trousers). */
  lengthTo?: "knees" | "ankles";
}

export interface GarmentFit {
  /** Canvas setTransform(a, b, c, d, e, f) in pixels. */
  matrix: [number, number, number, number, number, number];
  /** Top-centre anchor in pixels. */
  x: number;
  y: number;
  /** Rotation of the shoulder/hip line in radians (0 = level). */
  rotation: number;
  /** Rendered garment width in pixels. */
  width: number;
}

/** MediaPipe Pose landmark indices. */
export const LM = {
  leftShoulder: 11, rightShoulder: 12, leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26, leftAnkle: 27, rightAnkle: 28,
} as const;

export const MIN_VISIBILITY = 0.5;

type Vec = { x: number; y: number };
const mid = (a: Vec, b: Vec): Vec => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y });

export function computeGarmentFit(
  landmarks: readonly Landmark[],
  type: GarmentType,
  cal: Calibration,
  canvasW: number,
  canvasH: number,
): GarmentFit | null {
  const px = (i: number): Vec | null => {
    const l = landmarks[i];
    if (!l || (l.visibility ?? 1) < MIN_VISIBILITY) return null;
    return { x: l.x * canvasW, y: l.y * canvasH };
  };

  // Person's right side appears on image-left in an un-mirrored camera frame, so right→left = +x.
  const [r, l] = type === "top"
    ? [px(LM.rightShoulder), px(LM.leftShoulder)]
    : [px(LM.rightHip), px(LM.leftHip)];
  if (!r || !l) return null;

  let end: Vec | null;
  if (type === "top") {
    const rh = px(LM.rightHip), lh = px(LM.leftHip);
    if (rh && lh) {
      end = mid(rh, lh);
    } else {
      // In a close-up selfie, Pose Landmarker often sees the shoulders but not the hips.
      // Keep a useful upper-body preview instead of hiding the garment completely. Use a
      // downward perpendicular to the shoulder line, with a conservative torso estimate.
      const shoulderWidth = Math.hypot(l.x - r.x, l.y - r.y);
      const shoulderMid = mid(r, l);
      const downX = -(l.y - r.y);
      const downY = l.x - r.x;
      const sign = downY < 0 ? -1 : 1;
      const estimatedLength = shoulderWidth * 1.4;
      end = {
        x: shoulderMid.x + (downX / shoulderWidth) * estimatedLength * sign,
        y: shoulderMid.y + (downY / shoulderWidth) * estimatedLength * sign,
      };
    }
  } else {
    const [ri, li] = cal.lengthTo === "knees" ? [LM.rightKnee, LM.leftKnee] : [LM.rightAnkle, LM.leftAnkle];
    const re = px(ri), le = px(li);
    end = re && le ? mid(re, le) : null;
  }
  if (!end) return null;

  const start = mid(r, l);
  const across = sub(l, r);
  const along = sub(end, start);
  const w = Math.hypot(across.x, across.y);
  if (w < 1 || Math.hypot(along.x, along.y) < 1) return null;

  const X = { x: across.x * cal.widthScale, y: across.y * cal.widthScale };
  const Y = { x: along.x * cal.lengthScale, y: along.y * cal.lengthScale };
  const ox = start.x + across.x * cal.offsetX + along.x * cal.offsetY;
  const oy = start.y + across.y * cal.offsetX + along.y * cal.offsetY;

  return {
    matrix: [X.x, X.y, Y.x, Y.y, ox, oy],
    x: ox,
    y: oy,
    rotation: Math.atan2(across.y, across.x),
    width: w * cal.widthScale,
  };
}

/** Exponential moving average over landmark lists. alpha=1 → no smoothing, lower → steadier but laggier. */
export function smoothLandmarks(prev: readonly Landmark[] | null, next: readonly Landmark[], alpha: number): Landmark[] {
  if (!prev || prev.length !== next.length) return next.map((l) => ({ ...l }));
  return next.map((n, i) => ({
    x: prev[i].x + alpha * (n.x - prev[i].x),
    y: prev[i].y + alpha * (n.y - prev[i].y),
    visibility: n.visibility,
  }));
}
