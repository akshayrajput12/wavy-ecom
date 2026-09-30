import { clsx } from "clsx";
import type { GarmentType } from "../engine/garmentFit";
import type { FramingHint } from "../engine/framing";

/**
 * Body-outline placeholder the shopper lines up with before the garment appears.
 * Geometry (viewBox 0 0 300 400) matches GUIDE_TARGET in engine/framing.ts:
 *  - top:    bust, shoulders span 65→235 (~0.5 of width), waist inside the highlighted zone
 *  - bottom: full figure, hips span ~118→182 (~0.2 of width), feet at y≈386
 */
const BUST =
  "M150 44a34 34 0 1 1 0 68a34 34 0 1 1 0-68zM137 112v16c-26 4-50 10-60 24-10 14-12 36-12 60v188M235 400V212c0-24-2-46-12-60-10-14-34-20-60-24v-16M101 226l-3 174M199 226l3 174";
const FULL =
  "M150 20a20 20 0 1 1 0 40a20 20 0 1 1 0-40zM143 60v8c-17 3-31 7-37 16-5 8-6 20-6 34l-2 90h12l4-80 4 72 2 100 4 86h20l4-136h4l4 136h20l4-86 2-100 4-72 4 80h12l-2-90c0-14-1-26-6-34-6-9-20-13-37-16v-8";

/** `idle` = camera not started yet (dimmed preview); `locked` = shopper aligned, guide fades away. */
export function PoseGuide({ type, hint, locked, idle }: { type: GarmentType; hint: FramingHint; locked: boolean; idle?: boolean }) {
  const aligned = hint === "aligned";
  const zone = type === "top" ? { x: 50, y: 128, w: 200, h: 200 } : { x: 92, y: 196, w: 116, h: 196 };
  return (
    <div
      aria-hidden
      className={clsx(
        "pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-500",
        locked ? "opacity-0" : idle ? "opacity-40" : "opacity-100",
      )}
    >
      <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMid meet" className="size-[92%]">
        <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h} rx="18"
          className={clsx("transition-colors duration-300", aligned ? "fill-success/15" : "fill-on-dark/10")} />
        <path
          d={type === "top" ? BUST : FULL}
          vectorEffect="non-scaling-stroke"
          strokeWidth="2.5" strokeDasharray="7 6" strokeLinejoin="round" fill="none"
          className={clsx(
            "transition-colors duration-300",
            aligned ? "stroke-success" : "stroke-on-dark motion-safe:animate-pulse",
          )}
        />
      </svg>
      {/* viewfinder corners */}
      {/* inset below the top bar and above the hint chip */}
      {["left-4 top-18 border-l-2 border-t-2", "right-4 top-18 border-r-2 border-t-2",
        "bottom-18 left-4 border-b-2 border-l-2", "bottom-18 right-4 border-b-2 border-r-2"].map((c) => (
        <span key={c} className={clsx("absolute size-7 rounded-[4px] transition-colors", c, aligned ? "border-success" : "border-on-dark/80")} />
      ))}
    </div>
  );
}
