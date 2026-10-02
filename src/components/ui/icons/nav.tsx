"use client";

// Header / nav icons. Motion adapted from lucide-animated (MIT, (c) 2024-2026 pqoqubbw); paths Lucide (ISC). See ./base.tsx.
import { motion } from "framer-motion";
import { EASE_OUT, IconSvg, type IconProps } from "./base";

/** Bag: lifts on hover; pass `trigger={count}` to bounce when the cart count changes. */
export function ShoppingBagIcon(p: IconProps) {
  return (
    <IconSvg
      {...p}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      variants={{ normal: { y: 0, rotate: 0, scale: 1 }, animate: { y: [0, -3, 0], rotate: [0, -8, 5, 0], scale: [1, 1.1, 1] } }}
    >
      <motion.path d="M16 10a4 4 0 0 1-8 0" variants={{ normal: { y: 0 }, animate: { y: [0, 1, 0] } }} />
      <path d="M3.103 6.034h17.794" />
      <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
    </IconSvg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <IconSvg {...p} variants={{ normal: { x: 0, y: 0, rotate: 0 }, animate: { x: -1, y: -1, rotate: -12 } }}>
      <path d="m21 21-4.34-4.34" />
      <circle cx="11" cy="11" r="8" />
    </IconSvg>
  );
}

const line = (y: number, open: boolean, dir: 1 | -1 | 0) =>
  open ? (dir ? { y: 12 - y, rotate: 45 * dir, opacity: 1 } : { opacity: 0, scaleX: 0 }) : { y: 0, rotate: 0, opacity: 1, scaleX: 1 };

/** Three lines that morph into a close "X" while `open`; on hover the lines stagger. */
export function MenuIcon({ open = false, ...p }: IconProps & { open?: boolean }) {
  const nudge = (x: number) => ({ normal: { x: 0 }, animate: open ? { x: 0 } : { x: [0, x, 0] } });
  return (
    <IconSvg {...p} transition={{ duration: 0.4, ease: EASE_OUT }}>
      <motion.g variants={nudge(2)}><motion.path d="M4 5h16" initial={false} animate={line(5, open, 1)} /></motion.g>
      <motion.g variants={nudge(-2)}><motion.path d="M4 12h16" initial={false} animate={line(12, open, 0)} /></motion.g>
      <motion.g variants={nudge(2)}><motion.path d="M4 19h16" initial={false} animate={line(19, open, -1)} /></motion.g>
    </IconSvg>
  );
}

export function XIcon(p: IconProps) {
  return (
    <IconSvg {...p} variants={{ normal: { rotate: 0 }, animate: { rotate: 90 } }}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </IconSvg>
  );
}

/** Heart: grows on hover; `trigger={saved}` pulses on toggle. Fill it via className (e.g. `fill-ink`). */
export function HeartIcon(p: IconProps) {
  return (
    <IconSvg {...p} transition={{ duration: 0.4, ease: EASE_OUT }} variants={{ normal: { scale: 1 }, animate: { scale: [1, 1.22, 1.08] } }}>
      <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
    </IconSvg>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <motion.circle cx="12" cy="7" r="4" variants={{ normal: { y: 0 }, animate: { y: -1.5 } }} />
    </IconSvg>
  );
}
