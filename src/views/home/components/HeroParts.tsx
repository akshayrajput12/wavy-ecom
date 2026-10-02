"use client";

import Image from "next/image";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { Float } from "@/components/ui/Reveal";
import { accentWords } from "@/lib/format";
import type { HeroSlide } from "@/types/domain";
import { Word } from "./HeadingLines";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out

/**
 * Ambient tint: the slide's own image blurred into a glow under a vignette, so each slide's colour comes from its
 * product (HeroSlide has no colour field). Cross-fades between slides.
 */
export function HeroBackdrop({ slide, index }: { slide: HeroSlide; index: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <AnimatePresence initial={false}>
        <motion.div key={index} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 1.1, ease: "easeInOut" }}>
          <Image src={slide.image} alt="" fill sizes="25vw" className="scale-125 object-cover opacity-60 blur-3xl saturate-150" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,transparent_0%,color-mix(in_srgb,var(--black)_65%,transparent)_50%,var(--black)_100%)]" />
    </div>
  );
}

const slideVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 48, scale: 0.94 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -48, scale: 1.04 }),
};
const fadeVariants: Variants = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };

/** Floating product image with a soft ground shadow; cross-fades with a slight slide/scale (instant for reduced motion). */
export function HeroProduct({ slide, index, dir }: { slide: HeroSlide; index: number; dir: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative aspect-[4/5] w-[min(64vw,22rem)] lg:w-[min(30vw,28rem)]">
      <div className="absolute -bottom-12 left-1/2 h-10 w-4/5 -translate-x-1/2 rounded-[50%] bg-black/80 blur-2xl" aria-hidden />
      <Float amplitude={10} duration={7} className="absolute inset-0">
        <AnimatePresence initial={false} custom={dir}>
          <motion.div key={index} custom={dir} variants={reduce ? fadeVariants : slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: reduce ? 0 : 0.8, ease: EASE_OUT }} className="absolute inset-0 overflow-hidden rounded-xl shadow-lg">
            <Image src={slide.image} alt={slide.imageAlt} fill preload={index === 0} sizes="(min-width: 1024px) 30vw, 64vw" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </Float>
    </div>
  );
}

/**
 * Heading split into two balanced lines that rise in with a stagger; `*word*` renders as the italic accent.
 * `animate=false` renders it static (first paint).
 */
export function HeroHeadline({ text, animate }: { text: string; animate: boolean }) {
  const words = accentWords(text);
  const cut = Math.ceil(words.length / 2);
  const lines = words.length > 1 ? [words.slice(0, cut), words.slice(cut)] : [words];
  return (
    <h1 className="t-hero">
      {lines.map((line, i) => (
        <span key={i} className="-mx-[0.06em] -mb-[0.06em] block overflow-hidden px-[0.06em] pb-[0.1em]">
          {i > 0 && " "}
          <motion.span className="block" initial={animate ? { y: "105%" } : false} animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 + i * 0.08, ease: EASE_OUT }}>
            {line.map((w, j) => <span key={j}>{j > 0 && " "}<Word word={w} /></span>)}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
