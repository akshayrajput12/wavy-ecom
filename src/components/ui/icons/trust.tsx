"use client";

// Trust-row / delivery icons. Motion adapted from lucide-animated (MIT, (c) 2024-2026 pqoqubbw); paths Lucide (ISC). See ./base.tsx.
import { motion } from "framer-motion";
import { EASE_OUT, IconSvg, type IconProps } from "./base";

const T = { duration: 0.5, ease: EASE_OUT };

/** Rolls forward with a small road bump. */
export function TruckIcon(p: IconProps) {
  return (
    <IconSvg {...p} transition={T} variants={{ normal: { x: 0, y: 0 }, animate: { x: [0, 2.5, 0], y: [0, -1, 0, -0.5, 0] } }}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </IconSvg>
  );
}

/** Shield swells slightly while its tick re-draws. */
export function ShieldCheckIcon(p: IconProps) {
  return (
    <IconSvg {...p} transition={T} variants={{ normal: { scale: 1 }, animate: { scale: [1, 1.08, 1] } }}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <motion.path d="m9 12 2 2 4-4" variants={{ normal: { pathLength: 1 }, animate: { pathLength: [0, 1] } }} />
    </IconSvg>
  );
}

/** Pin hops once. */
export function MapPinIcon(p: IconProps) {
  return (
    <IconSvg {...p} transition={T} variants={{ normal: { y: 0 }, animate: { y: [0, -3, 0] } }}>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </IconSvg>
  );
}
