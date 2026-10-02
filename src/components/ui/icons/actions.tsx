"use client";

// Action icons. Motion adapted from lucide-animated (MIT, (c) 2024-2026 pqoqubbw); paths Lucide (ISC). See ./base.tsx.
import { motion } from "framer-motion";
import { EASE_OUT, IconSvg, type IconProps } from "./base";

/** Quarter-turns on hover; with `open` the vertical stroke folds away so it reads as a minus (FAQ toggles). */
export function PlusIcon({ open, ...p }: IconProps & { open?: boolean }) {
  return (
    <IconSvg {...p} variants={{ normal: { rotate: 0 }, animate: { rotate: open ? 0 : 90 } }}>
      <path d="M5 12h14" />
      <motion.path d="M12 5v14" initial={false} animate={{ scaleY: open ? 0 : 1, opacity: open ? 0 : 1 }} />
    </IconSvg>
  );
}

export function MinusIcon(p: IconProps) {
  return (
    <IconSvg {...p}>
      <motion.path d="M5 12h14" variants={{ normal: { scaleX: 1 }, animate: { scaleX: [1, 0.6, 1] } }} />
    </IconSvg>
  );
}

/** Blinks once (quick view). */
export function EyeIcon(p: IconProps) {
  return (
    <IconSvg {...p} transition={{ duration: 0.3, ease: EASE_OUT }} variants={{ normal: { scaleY: 1 }, animate: { scaleY: [1, 0.1, 1] } }}>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </IconSvg>
  );
}

/** Re-draws its tick on hover; `appear` draws it on mount. */
export function CheckIcon(p: IconProps) {
  return (
    <IconSvg {...p} transition={{ duration: 0.4, ease: EASE_OUT }}>
      <motion.path d="M20 6 9 17l-5-5" variants={{ normal: { pathLength: 1 }, animate: { pathLength: [0, 1] } }} />
    </IconSvg>
  );
}

export function CopyIcon(p: IconProps) {
  return (
    <IconSvg {...p}>
      <motion.rect width="14" height="14" x="8" y="8" rx="2" ry="2" variants={{ normal: { x: 0, y: 0 }, animate: { x: 1, y: 1 } }} />
      <motion.path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" variants={{ normal: { x: 0, y: 0 }, animate: { x: -1, y: -1 } }} />
    </IconSvg>
  );
}

const knob = (x: number) => ({ normal: { x: 0 }, animate: { x } });

/** Filter sliders: the three knobs slide. */
export function SlidersHorizontalIcon(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M10 5H3" /><path d="M12 19H3" /><path d="M21 12h-9" /><path d="M21 19h-5" /><path d="M21 5h-7" /><path d="M8 12H3" />
      <motion.path d="M14 3v4" variants={knob(-3)} />
      <motion.path d="M8 10v4" variants={knob(3)} />
      <motion.path d="M16 17v4" variants={knob(-3)} />
    </IconSvg>
  );
}

/** Rewinds a little (returns / easy exchange). */
export function RotateCcwIcon(p: IconProps) {
  return (
    <IconSvg {...p} transition={{ duration: 0.5, ease: EASE_OUT }} variants={{ normal: { rotate: 0 }, animate: { rotate: -50 } }}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </IconSvg>
  );
}

export function LogOutIcon(p: IconProps) {
  return (
    <IconSvg {...p}>
      <motion.g variants={{ normal: { x: 0 }, animate: { x: 2 } }}><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></motion.g>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </IconSvg>
  );
}
