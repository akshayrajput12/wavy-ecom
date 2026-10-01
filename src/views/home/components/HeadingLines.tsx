"use client";

import { clsx } from "clsx";
import { motion, useReducedMotion, type Variants } from "framer-motion";

const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out
const rise: Variants = { hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT } } };

/** Big display heading: an ink line plus an optional greyed second line; lines rise in, staggered, on scroll. */
export function HeadingLines({ line, soft, className }: { line: string; soft?: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.h2
      className={clsx("t-display", className)}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
    >
      <motion.span className="block" variants={rise}>{line}</motion.span>
      {soft && <motion.span className="block text-ink-soft" variants={rise}>{soft}</motion.span>}
    </motion.h2>
  );
}
