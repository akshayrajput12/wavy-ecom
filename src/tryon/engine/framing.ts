/**
 * Pure framing logic for the on-screen pose guide: is the shopper standing where the
 * guide silhouette is? Landmarks are MediaPipe-normalized to the *video frame*; the stage
 * shows that frame with `object-cover` and mirrored, so we first map into what is visible.
 */
import { LM, MIN_VISIBILITY, type GarmentType, type Landmark } from "./garmentFit";

export type FramingHint =
  | "no_person" | "show_hips" | "show_legs" | "move_left" | "move_right"
  | "move_closer" | "step_back" | "aligned";

export interface ViewRect { x0: number; y0: number; w: number; h: number }

/** Part of the video frame (0..1) that stays visible when drawn with object-fit: cover. */
export function coverRect(videoW: number, videoH: number, boxW: number, boxH: number): ViewRect {
  if (!videoW || !videoH || !boxW || !boxH) return { x0: 0, y0: 0, w: 1, h: 1 };
  const s = Math.max(boxW / videoW, boxH / videoH);
  const w = Math.min(1, boxW / (videoW * s));
  const h = Math.min(1, boxH / (videoH * s));
  return { x0: (1 - w) / 2, y0: (1 - h) / 2, w, h };
}

/**
 * Target zones for each guide silhouette, in visible-stage fractions.
 * ponytail: calibration knobs; they must match the geometry in components/PoseGuide.tsx.
 */
export const GUIDE_TARGET = {
  top: { span: [LM.leftShoulder, LM.rightShoulder], minSpan: 0.26, maxSpan: 0.62, need: [LM.leftHip, LM.rightHip] },
  bottom: { span: [LM.leftHip, LM.rightHip], minSpan: 0.1, maxSpan: 0.3, need: [LM.leftKnee, LM.rightKnee, LM.leftAnkle, LM.rightAnkle] },
} as const;
const CENTER_TOLERANCE = 0.12;

const seen = (l?: Landmark) => !!l && (l.visibility ?? 1) >= MIN_VISIBILITY;

export function framingHint(lms: readonly Landmark[] | null, type: GarmentType, view: ViewRect): FramingHint {
  if (!lms) return "no_person";
  const t = GUIDE_TARGET[type];
  const [a, b] = [lms[t.span[0]], lms[t.span[1]]];
  if (!seen(a) || !seen(b)) return "no_person";
  if (!t.need.every((i) => seen(lms[i]))) return type === "top" ? "show_hips" : "show_legs";

  // visible-stage coordinates, mirrored like the preview
  const toStageX = (x: number) => 1 - (x - view.x0) / view.w;
  const span = Math.abs(a.x - b.x) / view.w;
  const centre = (toStageX(a.x) + toStageX(b.x)) / 2;

  if (span > t.maxSpan) return "step_back";
  if (span < t.minSpan) return "move_closer";
  if (centre < 0.5 - CENTER_TOLERANCE) return "move_right";
  if (centre > 0.5 + CENTER_TOLERANCE) return "move_left";
  return "aligned";
}
