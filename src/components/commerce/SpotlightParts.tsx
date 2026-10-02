"use client";

import Image from "next/image";
import type { PointerEvent, ReactNode } from "react";
import { motion, useMotionValue, useSpring, type MotionValue } from "framer-motion";
import { clsx } from "clsx";
import { TrendingUp } from "lucide-react";
import type { Media, SpotlightItem } from "@/types/domain";
import { floatingCardCopy as copy } from "@/data/storefront";
import { ImageWell } from "./ImageWell";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out

/** The product photo, blurred and saturated, as the stage's coloured glow (same trick as the home hero). */
export function Glow({ media }: { media?: Media }) {
  if (!media?.url) return null;
  return <Image src={media.url} alt="" fill sizes="64px" className="scale-150 object-cover opacity-70 blur-2xl saturate-150" />;
}

/** Thin ring that fills with `progress` (0 → 1) around whatever it wraps (a 44px control). */
export function ProgressRing({ progress, children, className }: { progress: MotionValue<number>; children: ReactNode; className?: string }) {
  return (
    <span className={clsx("relative grid shrink-0 place-items-center", className)}>
      <svg viewBox="0 0 44 44" className="pointer-events-none absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r="20" fill="none" strokeWidth="1.5" className="stroke-line" />
        <motion.circle cx="22" cy="22" r="20" fill="none" strokeWidth="1.5" strokeLinecap="round" className="stroke-ink" style={{ pathLength: progress }} />
      </svg>
      {children}
    </span>
  );
}

/** "New arrival" with a live pulse, "Bestseller" with a trend mark. Text always carries the meaning. */
export function KindBadge({ kind }: { kind: SpotlightItem["kind"] }) {
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-micro font-medium leading-5",
      kind === "new" ? "bg-ink text-canvas" : "border border-line bg-surface-2 text-ink",
    )}>
      {kind === "new" ? (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inset-0 motion-safe:animate-ping rounded-full bg-current opacity-60" />
          <span className="relative size-1.5 rounded-full bg-current" />
        </span>
      ) : <TrendingUp className="size-3" strokeWidth={2} aria-hidden />}
      {copy.kind[kind]}
    </span>
  );
}

const SPRING = { stiffness: 180, damping: 18, mass: 0.6 };

/** Pointer-tilt for the floating packshot: returns the rotate springs and handlers for the area that tracks the pointer. */
export function useTilt(enabled: boolean) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, SPRING);
  const rotateY = useSpring(ry, SPRING);
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!enabled || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 22);
    rx.set(((e.clientY - r.top) / r.height - 0.5) * -22);
  };
  const onPointerLeave = () => { rx.set(0); ry.set(0); };
  return { style: { rotateX, rotateY }, handlers: { onPointerMove, onPointerLeave } };
}

/** Packshot floating above a soft ground shadow, tilting in 3D. */
export function FloatingShot({ media, tilt }: { media?: Media; tilt: ReturnType<typeof useTilt>["style"] }) {
  return (
    <div className="relative shrink-0 perspective-normal">
      <motion.div style={tilt} className="relative transform-3d">
        <ImageWell media={media} alt="" sizes="96px" className="aspect-[4/5] w-18 rounded-md shadow-lg ring-1 ring-line sm:w-22" />
      </motion.div>
      <span className="absolute -bottom-2 left-1/2 h-3 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/70 blur-md" aria-hidden />
    </div>
  );
}
