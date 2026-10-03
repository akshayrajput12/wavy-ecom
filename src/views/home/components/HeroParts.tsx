"use client";

import Image from "next/image";
import { AnimatePresence, motion, type MotionValue, type Variants } from "framer-motion";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { accentWords } from "@/lib/format";
import type { HeroSlide } from "@/types/domain";
import { MASK, Word } from "./HeadingLines";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out
const EASE_WIPE = [0.76, 0, 0.24, 1] as const; // in-out expo-ish: the wipe starts and lands softly
const WIPE_S = 1.05;

type Shift = { x: MotionValue<number>; y: MotionValue<number> };

/**
 * Ambient tint: the slide's own image blurred into a glow under a vignette, so each slide's colour comes from its
 * product (HeroSlide has no colour field). Cross-fades between slides; drifts against the pointer on desktop.
 */
export function HeroBackdrop({ slide, index, shift }: { slide: HeroSlide; index: number; shift?: Shift }) {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <motion.div className="absolute -inset-8" style={shift}>
        <AnimatePresence initial={false}>
          <motion.div key={index} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.3 : 1.2, ease: "easeInOut" }}>
            <Image src={slide.image} alt="" fill sizes="25vw" className="scale-125 object-cover opacity-40 blur-3xl saturate-125" />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,transparent_0%,color-mix(in_srgb,var(--black)_65%,transparent)_50%,var(--black)_100%)] lg:bg-[radial-gradient(ellipse_at_72%_50%,transparent_0%,color-mix(in_srgb,var(--black)_65%,transparent)_45%,var(--black)_100%)]" />
    </div>
  );
}

// incoming frame wipes in from the side it travels from, over the outgoing one (later in the DOM = on top)
const wipe: Variants = {
  enter: (dir: number) => ({ clipPath: dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)" }),
  center: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: WIPE_S, ease: EASE_WIPE } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: WIPE_S, ease: EASE_OUT } },
};
const fade: Variants = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };
// the photo inside the frame: inherits the frame's variant labels, so it settles exactly while the wipe plays
const settle: Variants = { enter: { scale: 1.2 }, center: { scale: 1, transition: { duration: 1.6, ease: EASE_OUT } } };

/**
 * The slide image in a portrait frame: clip-path wipe in the travel direction while the photo inside settles from
 * 1.2x to rest. First paint is static (AnimatePresence initial=false) so the priority image is the LCP. Reduced
 * motion: cross-fade only. The frame is sized from the viewport height (fixed 4:5 box), so it always fits the stage
 * and slide changes never shift layout.
 */
export function HeroMedia({ slide, index, dir }: { slide: HeroSlide; index: number; dir: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative aspect-[4/5] h-[clamp(15rem,calc(100svh-34rem),30rem)] max-w-full overflow-hidden rounded-xl shadow-lg lg:h-[clamp(20rem,calc(100svh-var(--header-h)-12rem),42rem)]">
      <AnimatePresence initial={false} custom={dir}>
        <motion.div key={index} custom={dir} variants={reduce ? fade : wipe} initial="enter" animate="center" exit="exit"
          transition={reduce ? { duration: 0.4 } : undefined} className="absolute inset-0 overflow-hidden">
          <motion.div className="absolute inset-0" variants={reduce ? undefined : settle}>
            <Image src={slide.image} alt={slide.imageAlt} fill preload={index === 0} sizes="(min-width: 1024px) 40vw, 80vw" className="object-cover" />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/**
 * Heading split into two balanced lines; every word rises out of its own mask, staggered, trailing the image wipe.
 * `*word*` renders as the italic accent. `animate=false` renders it static (first paint).
 */
export function HeroHeadline({ text, animate }: { text: string; animate: boolean }) {
  const words = accentWords(text);
  const cut = Math.ceil(words.length / 2);
  const lines = words.length > 1 ? [words.slice(0, cut), words.slice(cut)] : [words];
  let k = 0; // running word index across lines, for the stagger
  return (
    <h1 className="t-hero">
      {lines.map((line, i) => (
        <span key={i} className="block">
          {i > 0 && " "}
          {line.map((w, j) => {
            const delay = 0.25 + k++ * 0.06;
            return (
              <span key={j}>
                {j > 0 && " "}
                <span className={MASK}>
                  <motion.span className="inline-block" initial={animate ? { y: "110%" } : false} animate={{ y: 0 }}
                    transition={{ duration: 0.9, delay, ease: EASE_OUT }}>
                    <Word word={w} />
                  </motion.span>
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}
