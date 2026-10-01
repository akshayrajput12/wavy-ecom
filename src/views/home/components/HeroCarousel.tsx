"use client";

import Image from "next/image";
import { clsx } from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useState, type KeyboardEvent } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { homeCopy, homeStageCopy as copy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { EASE_OUT, HeroBackdrop, HeroHeadline, HeroProduct } from "./HeroParts";

const pad = (n: number) => String(n).padStart(2, "0");
const circle = "grid size-11 shrink-0 place-items-center rounded-pill border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-canvas";

/** Dark-stage hero: per-slide ambient tint, floating product, staggered headline, autoplay with a pause control. */
export function HeroCarousel({ section }: { section: HomeSectionOf<"hero_carousel"> }) {
  const { slides, autoplayMs } = section.config;
  const n = slides.length;
  const reduce = useReducedMotion();
  const [[index, dir], setPos] = useState<[number, number]>([0, 1]);
  const [moved, setMoved] = useState(false); // first paint is static (LCP); entrances play on slide changes
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false); // pointer over / focus inside

  const go = useCallback((step: number) => {
    setMoved(true);
    setPos(([i]): [number, number] => [(i + step + n) % n, step]);
  }, [n]);

  const auto = n > 1 && !reduce;
  const running = auto && !paused && !held;
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => { if (!document.hidden) go(1); }, autoplayMs ?? 6500);
    return () => window.clearInterval(t);
  }, [running, autoplayMs, go, index]);

  if (!n) return null;
  const slide = slides[index];
  const upNext = slides[(index + 1) % n];
  const fade = (delay: number) => ({
    initial: moved && !reduce ? { opacity: 0, y: 12 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE_OUT },
  } as const);
  const onKey = (e: KeyboardEvent) => {
    if (n < 2 || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault();
    go(e.key === "ArrowRight" ? 1 : -1);
  };

  return (
    <section aria-roledescription="carousel" aria-label={section.title ?? homeCopy.slideshow} onKeyDown={onKey}
      className="on-dark relative isolate overflow-hidden"
      onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHeld(false)}>
      <HeroBackdrop slide={slide} index={index} />
      <div className="container-x relative flex min-h-svh flex-col pb-6 pt-[calc(var(--header-h)+var(--space-8))] lg:pb-10">
        {n > 1 && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => go(-1)} aria-label={copy.prev} className={circle}><ChevronLeft className="size-4" aria-hidden /></button>
            <button type="button" onClick={() => go(1)} aria-label={copy.next} className={circle}><ChevronRight className="size-4" aria-hidden /></button>
            <p className="t-index ml-3 flex items-center gap-3 text-ink-soft" aria-hidden>
              <span className="text-ink">{pad(index + 1)}</span><span className="h-px w-10 bg-line" />{pad(n)}
            </p>
            {auto && (
              <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? copy.play : copy.pause} className={clsx(circle, "ml-auto lg:ml-3")}>
                {paused ? <Play className="size-4" aria-hidden /> : <Pause className="size-4" aria-hidden />}
              </button>
            )}
          </div>
        )}

        <div role="group" aria-roledescription="slide" aria-label={copy.slideOf(index + 1, n)} aria-live={running ? "off" : "polite"}
          className="mt-8 flex flex-1 flex-col lg:mt-12 lg:w-[34%]">
          {slide.eyebrow && <p className="t-overline mb-3 lg:sr-only">{slide.eyebrow}</p>}
          <HeroHeadline key={index} text={slide.heading} animate={moved && !reduce} />
          {slide.body && (
            <motion.p key={`b${index}`} {...fade(0.2)} className="mt-4 line-clamp-2 max-w-sm text-body text-ink-soft sm:line-clamp-none">{slide.body}</motion.p>
          )}
          {/* mobile: in flow between copy and CTAs; desktop: centred on the stage, out of flow */}
          <div className="grid flex-1 place-items-center py-12 lg:pointer-events-none lg:absolute lg:inset-y-0 lg:left-[36%] lg:right-[8%] lg:py-0">
            <HeroProduct slide={slide} index={index} dir={dir} />
          </div>
          {(slide.cta || slide.secondaryCta) && (
            <motion.div key={`c${index}`} {...fade(0.28)} className="flex flex-col gap-3 sm:flex-row lg:mt-8">
              {slide.cta && (
                <ButtonLink href={slide.cta.href} size="lg" className="w-full sm:w-auto">
                  {slide.cta.label}<ChevronRight className="size-4" aria-hidden />
                </ButtonLink>
              )}
              {slide.secondaryCta && <ButtonLink href={slide.secondaryCta.href} variant="secondary" size="lg" className="w-full sm:w-auto">{slide.secondaryCta.label}</ButtonLink>}
            </motion.div>
          )}
        </div>

        <div className="relative mt-6 hidden min-h-24 items-end justify-end lg:flex">
          {slide.eyebrow && <p className="t-meta absolute inset-x-0 bottom-2 mx-auto max-w-56 text-center" aria-hidden>{slide.eyebrow}</p>}
          {n > 1 && (
            <button type="button" onClick={() => go(1)} aria-label={copy.nextUp(upNext.heading)}
              className="group relative size-24 overflow-hidden rounded-lg border border-line">
              <Image src={upNext.image} alt="" fill sizes="96px" className="object-cover transition-[scale] duration-(--dur-slow) ease-soft group-hover:scale-110" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
