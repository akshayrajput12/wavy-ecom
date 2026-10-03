"use client";

import { AnimatePresence, motion, useSpring, type MotionValue } from "framer-motion";
import { Pause, Play } from "lucide-react";
import type { PointerEvent, ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useMediaQuery, useReducedMotion } from "@/components/ui/useMediaQuery";
import { homeStageCopy as copy } from "@/data/storefront";
import { EASE_OUT } from "./HeroParts";

const pad = (n: number) => String(n).padStart(2, "0");
const MAG = { stiffness: 220, damping: 16, mass: 0.5 };
const circle = "grid size-11 shrink-0 place-items-center rounded-pill border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-canvas";

/** Magnetic pill: leans toward a fine pointer while it is over it, springs back on leave. Static on touch / reduced motion. */
export function Magnetic({ children, className }: { children: ReactNode; className?: string }) {
  const fine = useMediaQuery("(pointer: fine)");
  const reduce = useReducedMotion();
  const x = useSpring(0, MAG);
  const y = useSpring(0, MAG);
  const on = fine && !reduce;
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!on) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.2);
    y.set((e.clientY - r.top - r.height / 2) * 0.25);
  };
  return (
    <motion.div className={className} style={{ x, y }} onPointerMove={move} onPointerLeave={() => { x.set(0); y.set(0); }}>
      {children}
    </motion.div>
  );
}

/**
 * "01 ——— 04": the current number rolls up through a mask, and the hairline between fills with the autoplay timer
 * (`progress`), or shows the position in the set when there is no autoplay.
 */
function StageCounter({ index, n, progress }: { index: number; n: number; progress?: MotionValue<number> }) {
  return (
    <p className="t-index flex items-center gap-3 text-ink-soft" aria-hidden>
      <span className="relative inline-flex overflow-hidden text-ink">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={index} className="inline-block" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }}
            transition={{ duration: 0.5, ease: EASE_OUT }}>
            {pad(index + 1)}
          </motion.span>
        </AnimatePresence>
      </span>
      <span className="relative h-px w-16 overflow-hidden bg-line sm:w-24">
        <motion.span className="absolute inset-0 origin-left bg-ink" style={{ scaleX: progress ?? (index + 1) / n }} />
      </span>
      {pad(n)}
    </p>
  );
}

type ControlsProps = {
  index: number;
  n: number;
  progress?: MotionValue<number>; // set when autoplay is on: shows the timer and the pause toggle
  paused: boolean;
  onPause: () => void;
  go: (step: number) => void;
};

/** The one control bar, captioning the frame: counter + timer left, pause / prev / next right, over a hairline rule. */
export function StageControls({ index, n, progress, paused, onPause, go }: ControlsProps) {
  return (
    <div className="flex w-full items-center justify-between gap-4 border-t border-line pt-5">
      <StageCounter index={index} n={n} progress={progress} />
      <div className="flex items-center gap-2">
        {progress && (
          <button type="button" onClick={onPause} aria-label={paused ? copy.play : copy.pause} className={circle}>
            {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
          </button>
        )}
        <button type="button" onClick={() => go(-1)} aria-label={copy.prev} className={circle}><ChevronLeftIcon className="size-4" /></button>
        <button type="button" onClick={() => go(1)} aria-label={copy.next} className={circle}><ChevronRightIcon className="size-4" /></button>
      </div>
    </div>
  );
}
