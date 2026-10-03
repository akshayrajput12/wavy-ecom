"use client";

import { motion, useInView } from "framer-motion";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { ChevronRightIcon } from "@/components/ui/icons";
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { homeCopy, homeStageCopy as copy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { Magnetic, StageControls } from "./HeroControls";
import { EASE_OUT, HeroBackdrop, HeroHeadline, HeroMedia } from "./HeroParts";
import { useAutoplayProgress, useHeroScroll, usePageHidden, usePointerParallax } from "./useHeroMotion";

/**
 * Dark-stage editorial hero. Slide change: the framed image wipes in (clip-path) from the travel side while the photo
 * settles, headline words rise through masks, copy follows. A hairline timer fills between "01 — 04"; autoplay pauses
 * on hover, focus, a hidden tab or the hero being off-screen; all controls sit in one bar under the frame. Desktop adds a
 * light pointer parallax and magnetic CTAs; scrolling away zooms the media out and fades the copy. Reduced motion:
 * fades only, no autoplay.
 */
export function HeroCarousel({ section }: { section: HomeSectionOf<"hero_carousel"> }) {
  const { slides, autoplayMs } = section.config;
  const n = slides.length;
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const [[index, dir], setPos] = useState<[number, number]>([0, 1]);
  const [moved, setMoved] = useState(false); // first paint is static (LCP); entrances play on slide changes
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false); // mouse over / focus inside
  const hidden = usePageHidden();
  const inView = useInView(ref, { amount: 0.35 });
  const parallax = usePointerParallax();
  const scroll = useHeroScroll(ref);

  const go = useCallback((step: number) => {
    setMoved(true);
    setPos(([i]): [number, number] => [(i + step + n) % n, step]);
  }, [n]);
  const next = useCallback(() => go(1), [go]);

  const auto = n > 1 && !reduce;
  const running = auto && !paused && !held && !hidden && inView;
  const progress = useAutoplayProgress(running, autoplayMs ?? 6500, index, next);

  if (!n) return null;
  const slide = slides[index];
  const enter = (delay: number) => ({
    initial: moved ? { opacity: 0, y: reduce ? 0 : 14 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay: reduce ? 0 : delay, ease: EASE_OUT },
  } as const);
  const onKey = (e: KeyboardEvent) => {
    if (n < 2 || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    go(e.key === "ArrowRight" ? 1 : -1);
  };
  const mouse = (on: boolean) => (e: PointerEvent) => {
    if (e.pointerType === "mouse") setHeld(on);
    if (!on) parallax.reset();
  };

  return (
    <section ref={ref} aria-roledescription="carousel" aria-label={section.title ?? homeCopy.slideshow} onKeyDown={onKey}
      className="on-dark relative isolate overflow-hidden"
      onPointerEnter={mouse(true)} onPointerLeave={mouse(false)} onPointerMove={parallax.move}
      onFocus={() => setHeld(true)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}>
      <HeroBackdrop slide={slide} index={index} shift={parallax.back} />
      <div className="container-x flex min-h-svh flex-col pb-8 lg:justify-center pt-[calc(var(--header-h)+var(--space-6))] lg:pt-[calc(var(--header-h)+var(--space-8))]">
        {/* mobile: one column (copy, frame + control bar, CTAs). Desktop: copy + CTAs left, the eyebrow on the frame's
            top edge; the control bar captions the frame. The lower left stays free for the site-wide spotlight card. */}
        <div role="group" aria-roledescription="slide" aria-label={copy.slideOf(index + 1, n)} aria-live={running ? "off" : "polite"}
          className="grid gap-y-6 lg:grid-cols-2 lg:grid-rows-[auto_auto_1fr] lg:gap-x-16 lg:gap-y-0">
          <motion.div style={scroll.copy} className="lg:max-w-xl">
            {slide.eyebrow && <motion.p key={`e${index}`} {...enter(0.15)} className="t-overline mb-4 text-ink-soft">{slide.eyebrow}</motion.p>}
            <motion.div key={`h${index}`} initial={moved && reduce ? { opacity: 0 } : false} animate={{ opacity: 1 }}>
              <HeroHeadline text={slide.heading} animate={moved && !reduce} />
            </motion.div>
            {slide.body && (
              <motion.p key={`b${index}`} {...enter(0.45)} className="mt-5 line-clamp-2 max-w-md text-body text-ink-soft sm:line-clamp-3 lg:mt-6">{slide.body}</motion.p>
            )}
          </motion.div>

          <motion.div style={scroll.media} className="flex flex-col items-center gap-5 sm:w-fit sm:items-stretch lg:col-start-2 lg:row-span-full lg:self-center lg:justify-self-center">
            <motion.div style={{ ...parallax.media, touchAction: "pan-y" }} className="max-w-full"
              onPanEnd={n > 1 ? (_, info) => Math.abs(info.offset.x) > 48 && go(info.offset.x < 0 ? 1 : -1) : undefined}>
              <HeroMedia slide={slide} index={index} dir={dir} />
            </motion.div>
            {n > 1 && <StageControls index={index} n={n} progress={auto ? progress : undefined} paused={paused} onPause={() => setPaused((p) => !p)} go={go} />}
          </motion.div>

          {(slide.cta || slide.secondaryCta) && (
            <motion.div style={scroll.copy} className="lg:col-start-1 lg:row-start-2 lg:mt-10">
              <motion.div key={`c${index}`} {...enter(0.55)} className="flex flex-wrap gap-3">
                {slide.cta && (
                  <Magnetic className="flex-[1_1_auto] sm:flex-none">
                    <ButtonLink href={slide.cta.href} size="lg" className="w-full whitespace-nowrap max-sm:px-5">
                      {slide.cta.label}<ChevronRightIcon className="size-4" />
                    </ButtonLink>
                  </Magnetic>
                )}
                {slide.secondaryCta && (
                  <Magnetic className="flex-[1_1_auto] sm:flex-none">
                    <ButtonLink href={slide.secondaryCta.href} variant="secondary" size="lg" className="w-full whitespace-nowrap max-sm:px-5">{slide.secondaryCta.label}</ButtonLink>
                  </Magnetic>
                )}
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
