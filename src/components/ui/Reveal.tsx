"use client";

import { clsx } from "clsx";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { useRef } from "react";
import { useReducedMotion } from "./useMediaQuery";
import type { ReactNode } from "react";

const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out

/** Fade-and-rise on first scroll into view. Reduced-motion users get the content immediately. */
export function Reveal({ children, delay = 0, y = 16, className, as = "div" }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "li" }) {
  const reduce = useReducedMotion();
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag
      data-reveal
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.64, delay, ease: EASE_OUT }}
    >
      {children}
    </Tag>
  );
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.64, ease: EASE_OUT } },
};

/** Staggers its direct `StaggerItem` children in once, on scroll into view. `as="ul"` pairs with `StaggerItem as="li"`. */
export function Stagger({ children, className, gap = 0.06, as = "div" }: { children: ReactNode; className?: string; gap?: number; as?: "div" | "ul" }) {
  const reduce = useReducedMotion();
  const Tag = as === "ul" ? motion.ul : motion.div;
  return (
    <Tag
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: "div" | "li" }) {
  const Tag = as === "li" ? motion.li : motion.div;
  return <Tag data-reveal className={className} variants={item}>{children}</Tag>;
}

/** Gentle floating y-loop (home floating product showcase). Static for reduced-motion users. */
export function Float({ children, className, amplitude = 8, duration = 6, delay = 0 }: { children: ReactNode; className?: string; amplitude?: number; duration?: number; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0] }}
      transition={{ duration, delay, ease: "easeInOut", repeat: Infinity }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scroll parallax for large imagery: the child (usually a `fill` image) drifts ±6% inside a clipping frame.
 * Size and round the frame through `className`. Static for reduced motion. MotionValue only, no re-renders.
 */
export function Parallax({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  return (
    <div ref={ref} className={clsx("relative overflow-hidden", className)}>
      {/* 8% overhang each side covers the ±6% drift (of a 116% tall layer) */}
      <motion.div className="absolute inset-x-0 -inset-y-[8%]" style={reduce ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}

/** Hairline page-scroll progress bar pinned to the top edge; inverts over dark stages (difference blend). */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div aria-hidden style={{ scaleX: scrollYProgress }}
      className="pointer-events-none fixed inset-x-0 top-0 z-60 h-0.5 origin-left bg-on-dark mix-blend-difference" />
  );
}
