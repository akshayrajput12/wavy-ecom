"use client";

// Arrows + chevrons: nudge toward their direction while the parent is hovered/focused.
// Motion adapted from lucide-animated (MIT, (c) 2024-2026 pqoqubbw); paths Lucide (ISC). See ./base.tsx.
import { IconSvg, type IconProps } from "./base";

const nudge = (x: number, y: number) => ({ normal: { x: 0, y: 0 }, animate: { x, y } });

export function ArrowRightIcon(p: IconProps) {
  return <IconSvg {...p} variants={nudge(3, 0)}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></IconSvg>;
}

export function ArrowLeftIcon(p: IconProps) {
  return <IconSvg {...p} variants={nudge(-3, 0)}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></IconSvg>;
}

export function ArrowUpIcon(p: IconProps) {
  return <IconSvg {...p} variants={nudge(0, -3)}><path d="m5 12 7-7 7 7" /><path d="M12 19V5" /></IconSvg>;
}

export function ArrowUpRightIcon(p: IconProps) {
  return <IconSvg {...p} variants={nudge(2, -2)}><path d="M7 7h10v10" /><path d="M7 17 17 7" /></IconSvg>;
}

export function ChevronRightIcon(p: IconProps) {
  return <IconSvg {...p} variants={nudge(2, 0)}><path d="m9 18 6-6-6-6" /></IconSvg>;
}

export function ChevronLeftIcon(p: IconProps) {
  return <IconSvg {...p} variants={nudge(-2, 0)}><path d="m15 18-6-6 6-6" /></IconSvg>;
}

/** Nudges down on hover; rotate it for open state with a class (`rotate-180`), which composes with the nudge. */
export function ChevronDownIcon(p: IconProps) {
  return <IconSvg {...p} variants={nudge(0, 2)}><path d="m6 9 6 6 6-6" /></IconSvg>;
}
