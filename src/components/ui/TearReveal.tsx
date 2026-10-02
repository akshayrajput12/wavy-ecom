"use client";

import { clsx } from "clsx";
import Image from "next/image";
import { useId, useRef, type CSSProperties } from "react";
import { tearRevealCopy } from "@/data/storefront";
import type { Cta } from "@/types/domain";
import { ButtonLink } from "./Button";
import { useReducedMotion } from "./useMediaQuery";
import { ArtDefs, Eyes, Fur, Half } from "./TearArt";
import { TearCopy } from "./TearCopy";
import { LINE, eyePose, tearPose, useTearMotion } from "./tearMotion";
import { FAR, FRAME_H, FRAME_W, PIVOT_DY, VIEW_W, buildFibres, clamp01, viewBox } from "./tearGeometry";

export interface TearRevealProps {
  /** The big word that gets torn. */
  word: string;
  /** Small line above the word. Empty hides it. */
  tagline?: string;
  /** "tiger" (default): a drawn tiger rises into the gap. "image": the paper clears off a full-bleed photo (needs `image`). */
  variant?: "tiger" | "image";
  image?: string;
  imageAlt?: string;
  /** Pill that fades in (and becomes focusable) once fully open. */
  cta?: Cta;
  /** Height of the pinned stage. A definite length, never a percentage. */
  height?: string;
  /** Extra scroll the tear plays over, on top of `height` (md and up). */
  scrollDistance?: string;
  /** Same, below md. */
  mobileScrollDistance?: string;
  /** 0..1. Drive the tear yourself instead of from scroll (1 = fully torn). */
  progress?: number;
  hint?: boolean;
  className?: string;
}

const FIBRES = buildFibres();
/** The halves' layers overhang the stage by 12.5% a side, so their edges never show as they part and tilt. */
const GROW = 1.25;
const STAGE = { "--u": `min(100cqw / ${FRAME_W}, 100cqh / ${FRAME_H})` } as CSSProperties;
const PIVOT = `50% calc(50% + ${PIVOT_DY} * var(--u))`;
const LAYER = "absolute inset-0 block size-full max-w-none";

/**
 * A poster that tears in two as you scroll past (sticky stage over a scroll runway). The art renders once; scroll moves
 * it through `useTearMotion` (CSS transforms on composited layers, no React renders). Reduced motion: the fully torn
 * final state, static, no runway.
 */
export function TearReveal({
  word, tagline, variant = "tiger", image, imageAlt = "", cta,
  height = "100svh", scrollDistance = "140svh", mobileScrollDistance = "100svh", progress, hint = true, className,
}: TearRevealProps) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion(); // false while hydrating (matches the server), then live
  const id = "tr" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const photo = variant === "image" && image ? image : undefined;
  const pinned = !(progress !== undefined || reduced);
  const handlers = useTearMotion({ root: rootRef, stage: stageRef, progress, photo: !!photo, enabled: !reduced });
  // the first paint (and the reduced-motion state); afterwards the hook writes straight to the DOM
  const p0 = clamp01(reduced ? progress ?? 1 : progress ?? 0);
  const t = tearPose(p0, !!photo);

  const sheet = (
    <>
      <rect x={-FAR} y={-FAR} width={FAR * 2 + VIEW_W} height={FAR * 2} style={{ fill: "var(--canvas)" }} />
      <TearCopy word={word} tagline={tagline} />
    </>
  );

  return (
    <section
      ref={rootRef}
      className={clsx("relative w-full overflow-clip bg-canvas", pinned ? "h-[calc(var(--tr-h)+var(--tr-run-sm))] md:h-[calc(var(--tr-h)+var(--tr-run))]" : "h-(--tr-h)", className)}
      style={{ "--tr-h": height, "--tr-run": scrollDistance, "--tr-run-sm": mobileScrollDistance } as CSSProperties}
    >
      <div ref={stageRef} className="sticky top-0 h-(--tr-h) w-full overflow-hidden [container-type:size]" style={STAGE} {...handlers}>
        {photo && (
          <div data-tr="photo" className="absolute inset-0 overflow-hidden will-change-transform" style={{ transform: t.photo }}>
            <Image src={photo} alt={imageAlt} fill sizes="100vw" className="object-cover" />
          </div>
        )}
        <div data-tr="shake" role="img" aria-label={(photo ? tearRevealCopy.image : tearRevealCopy.tiger)(word, tagline)}
          className="pointer-events-none absolute inset-0" style={{ transform: t.shake }}>
          <svg aria-hidden className="absolute size-0"><ArtDefs id={id} /></svg>
          {/* back to front: tiger (fur painted once, eyes on their own small layer), the two halves, the whole sheet, the crack */}
          {!photo && (
            <div data-tr="tiger" className="absolute inset-0 will-change-transform" style={{ transform: t.tiger, transformOrigin: PIVOT }}>
              <svg aria-hidden viewBox={viewBox()} className={LAYER}><Fur id={id} /></svg>
              <svg aria-hidden viewBox={viewBox()} className={clsx(LAYER, "will-change-transform")}>
                <Eyes id={id} pose={eyePose(p0)} fibres={FIBRES} />
              </svg>
            </div>
          )}
          {(["top", "bottom"] as const).map((side) => (
            <div key={side} data-tr={side} className="absolute -inset-[12.5%] will-change-transform" style={{ transform: t[side], transformOrigin: PIVOT }}>
              {(["shadow", "sheet", "edge"] as const).map((part) => (
                <svg key={part} aria-hidden viewBox={viewBox(GROW)} className={clsx(LAYER, part !== "sheet" && "will-change-transform")}>
                  <Half id={id} side={side} line={LINE} open={t.s.open} part={part}>{part === "sheet" && sheet}</Half>
                </svg>
              ))}
            </div>
          ))}
          {/* whole until it tears: two clipped halves would leave a hairline seam */}
          <svg data-tr="whole" aria-hidden viewBox={viewBox()} className={LAYER} style={{ visibility: t.s.open > 0 ? "hidden" : undefined }}>{sheet}</svg>
          <svg aria-hidden viewBox={viewBox()} className={LAYER}>
            <path data-tr="crack" d={t.crack || "M0 0"} fill="none" style={{ stroke: "var(--ink)" }} strokeWidth={2.4} strokeLinejoin="bevel"
              opacity={t.crack ? t.crackOpacity : 0} />
          </svg>
        </div>

        {hint && pinned && (
          <div data-tr="hint" aria-hidden className="t-index pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center gap-2 uppercase tracking-[0.35em] text-ink-soft"
            style={{ opacity: t.hint }}>
            {tearRevealCopy.hint}
            <span className="block h-6 w-px animate-pulse bg-ink-soft" />
          </div>
        )}
        {cta && (
          <div data-tr="cta" inert={!t.done} className="absolute inset-x-0 bottom-10 flex justify-center px-4 transition-opacity duration-(--dur-slow) ease-out sm:bottom-14"
            style={{ opacity: t.done ? 1 : 0 }}>
            <ButtonLink href={cta.href} size="lg" className="shadow-md">{cta.label}</ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}

