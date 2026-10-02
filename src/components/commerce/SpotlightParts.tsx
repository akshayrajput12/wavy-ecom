"use client";

import type { PointerEvent, ReactNode } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, type MotionValue } from "framer-motion";
import { clsx } from "clsx";
import { TrendingUp } from "lucide-react";
import type { Media, SpotlightItem } from "@/types/domain";
import { floatingCardCopy as copy } from "@/data/storefront";
import { ImageWell } from "./ImageWell";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out
const FADE = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

/** Thin ring that fills with `progress` (0 → 1) around whatever it wraps (the minimised pill's thumbnail). */
export function ProgressRing({ progress, children, className }: { progress: MotionValue<number>; children: ReactNode; className?: string }) {
  return (
    <span className={clsx("relative grid shrink-0 place-items-center", className)}>
      <svg viewBox="0 0 44 44" className="pointer-events-none absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r="20.5" fill="none" strokeWidth="1.5" className="stroke-line" />
        <motion.circle cx="22" cy="22" r="20.5" fill="none" strokeWidth="1.5" strokeLinecap="round" className="stroke-ink" style={{ pathLength: progress }} />
      </svg>
      {children}
    </span>
  );
}

/** Overline pill: "New arrival" with a live ink dot, "Bestseller" with a trend mark. Text always carries the meaning. */
export function KindBadge({ kind }: { kind: SpotlightItem["kind"] }) {
  return (
    <span className="t-overline inline-flex items-center gap-1.5 whitespace-nowrap rounded-pill border border-line bg-surface px-2.5 py-1 leading-none text-ink">
      {kind === "new" ? (
        <span className="relative flex size-1.5" aria-hidden>
          <span className="absolute inset-0 rounded-full bg-ink opacity-50 motion-safe:animate-ping" />
          <span className="relative size-1.5 rounded-full bg-ink" />
        </span>
      ) : <TrendingUp className="size-3" strokeWidth={2} aria-hidden />}
      {copy.kind[kind]}
    </span>
  );
}

const SPRING = { stiffness: 200, damping: 20, mass: 0.5 };

/** Micro pointer-tilt (±4°, mouse only) for the packshot: rotate springs + handlers for the area that tracks the pointer. */
export function useTilt(enabled: boolean) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, SPRING);
  const rotateY = useSpring(ry, SPRING);
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!enabled || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 8);
    rx.set(((e.clientY - r.top) / r.height - 0.5) * -8);
  };
  const onPointerLeave = () => { rx.set(0); ry.set(0); };
  return { style: { rotateX, rotateY }, handlers: { onPointerMove, onPointerLeave } };
}

/** Packshot on its paper well with a soft floor shadow; products cross-fade in place, the photo scales 1.04 on card hover. */
export function Shot({ id, media, tilt, reduce }: { id: string; media?: Media; tilt: ReturnType<typeof useTilt>["style"]; reduce: boolean }) {
  return (
    <div className="relative shrink-0 perspective-normal">
      <span className="absolute inset-x-3 -bottom-1.5 h-4 rounded-[50%] bg-ink/15 blur-md" aria-hidden />
      <motion.div style={tilt} className="relative aspect-4/5 w-22 overflow-hidden rounded-lg bg-surface-2 ring-1 ring-line-soft sm:w-24">
        <AnimatePresence initial={false}>
          <motion.div key={id} {...FADE} transition={{ duration: reduce ? 0 : 0.6, ease: EASE_OUT }} className="absolute inset-0">
            <ImageWell media={media} alt="" sizes="96px" className="size-full"
              imgClassName="transition-transform duration-(--dur-slow) ease-soft motion-safe:group-hover/card:scale-[1.04]" />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/** Minimised state: a light glass pill with the live thumbnail (ringed by the rotation progress) and the kind label. */
export function MiniPill({ id, media, kind, progress, reduce }: {
  id: string; media?: Media; kind: SpotlightItem["kind"]; progress: MotionValue<number>; reduce: boolean;
}) {
  const t = { duration: reduce ? 0 : 0.45, ease: EASE_OUT };
  return (
    <span className="flex items-center gap-2.5 rounded-pill border border-line bg-surface/85 p-1 shadow-md backdrop-blur-xl sm:pr-4">
      <ProgressRing progress={progress} className="size-10">
        <span className="relative size-8 overflow-hidden rounded-pill bg-surface-2">
          <AnimatePresence initial={false}>
            <motion.span key={id} {...FADE} transition={t} className="absolute inset-0">
              <ImageWell media={media} alt="" sizes="32px" className="size-full" />
            </motion.span>
          </AnimatePresence>
        </span>
      </ProgressRing>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={kind} {...FADE} transition={t} className="t-overline whitespace-nowrap text-ink max-sm:hidden">{copy.kind[kind]}</motion.span>
      </AnimatePresence>
    </span>
  );
}
