"use client";

import { cubicBezier, motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/components/ui/useMediaQuery";

const EASE = cubicBezier(0.22, 1, 0.36, 1); // mirrors --ease-out

/**
 * Advance widths in em for .t-wordmark (Bricolage 700, 82% width, -0.04em tracking), measured in Chrome and rounded
 * up, so the server can size the wordmark to fill its container without JS. Unknown glyphs count as lowercase.
 */
function wordmarkEm(name: string) {
  return Array.from(name).reduce((sum, ch) =>
    sum + (/[iljI.,:;'!|]/.test(ch) ? 0.16 : /[frtJ1\- ]/.test(ch) ? 0.26 : /[mwMW]/.test(ch) ? 0.68 : /[A-Z0-9]/.test(ch) ? 0.46 : 0.41), 0);
}

/** One letter: rises out of the row's mask and swings upright, over its own slice of the footer's scroll. */
function Letter({ ch, i, n, progress }: { ch: string; i: number; n: number; progress: MotionValue<number> }) {
  const start = 0.1 + (n > 1 ? (i / (n - 1)) * 0.4 : 0); // staggered by index; the last letter lands at 95%
  const range = [start, start + 0.45];
  const y = useTransform(progress, range, ["130%", "0%"], { ease: EASE });
  const rotate = useTransform(progress, range, [10, 0], { ease: EASE });
  return <motion.span className="inline-block origin-bottom-left" style={{ y, rotate }}>{ch}</motion.span>;
}

/**
 * Giant store-name wordmark that closes the footer. As it scrolls into view each letter rises from a mask, scroll-
 * linked (MotionValues only, no re-renders). Server render, no-JS and reduced motion get the finished wordmark; the
 * animation only arms when the wordmark starts below the fold, so it never flashes back to the start pose.
 */
export function FooterWordmark({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const [armed, setArmed] = useState(false);
  // "end end": the wordmark is the last thing on the page, so the bottom of the page is progress 1
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });

  // re-checked per route (the footer persists across client navigations; a short page shows it at rest)
  useEffect(() => {
    const el = ref.current;
    setArmed(!!el && el.getBoundingClientRect().top > window.innerHeight);
  }, [pathname]);

  const letters = Array.from(name);
  const live = armed && !reduce;
  // fills the container (cqw) for any name length; very short names are capped so they don't tower
  const fontSize = `min(42cqw, ${(96 / Math.max(wordmarkEm(name), 0.5)).toFixed(2)}cqw)`;
  return (
    <div ref={ref} className="container-x @container">
      <p className="t-wordmark -mt-[0.06em] select-none overflow-hidden pb-[0.12em] text-center" style={{ fontSize }}>
        <span className="sr-only">{name}</span>
        <span aria-hidden>
          {/* keys differ so arming remounts the letters: no stale transforms either way */}
          {letters.map((ch, i) => live
            ? <Letter key={`m${i}`} ch={ch} i={i} n={letters.length} progress={scrollYProgress} />
            : <span key={`s${i}`} className="inline-block">{ch}</span>)}
        </span>
      </p>
    </div>
  );
}
