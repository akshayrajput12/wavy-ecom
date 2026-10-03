"use client";

import { clsx } from "clsx";
import { motion, type Variants } from "framer-motion";
import { Fragment } from "react";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { accentWords, type AccentSegment } from "@/lib/format";

const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out
const rise: Variants = { hidden: { y: "110%" }, show: { y: 0, transition: { duration: 0.8, ease: EASE_OUT } } };
// the mask: padding gives descenders, accents and the italic overhang room; equal negative margins keep the line box
export const MASK = "inline-block overflow-hidden px-[0.06em] -mx-[0.06em] pb-[0.14em] -mb-[0.14em] pt-[0.04em] -mt-[0.04em] align-bottom";

/** One heading word: its segments, accent ones as <em> (styled by globals.css). */
export const Word = ({ word }: { word: AccentSegment[] }) =>
  word.map((s, i) => (s.accent ? <em key={i}>{s.text}</em> : <Fragment key={i}>{s.text}</Fragment>));

/** Words of one line, each rising out of its own mask. */
function Line({ text, className }: { text: string; className?: string }) {
  return (
    <span className={clsx("block", className)}>
      {accentWords(text).map((w, i) => (
        <Fragment key={i}>
          {i > 0 && " "}
          <span className={MASK}><motion.span data-reveal className="inline-block" variants={rise}><Word word={w} /></motion.span></span>
        </Fragment>
      ))}
    </span>
  );
}

/**
 * Big display heading: an ink line plus an optional greyed second line. Words rise out of a mask, staggered, on
 * scroll into view. `*word*` in the text renders as the italic accent. `hero` uses the larger .t-hero scale.
 */
export function HeadingLines({ line, soft, className, id, hero }: { line: string; soft?: string; className?: string; id?: string; hero?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.h2
      id={id}
      className={clsx(hero ? "t-hero" : "t-display", className)}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }}
    >
      <Line text={line} />
      {soft && <Line text={soft} className="text-ink-soft" />}
    </motion.h2>
  );
}
