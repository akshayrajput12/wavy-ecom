"use client";

import { getImageProps } from "next/image";
import { clsx } from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { Carousel } from "@/components/ui/Carousel";
import { ButtonLink } from "@/components/ui/Button";
import { homeCopy } from "@/data/storefront";
import type { HeroSlide, HomeSectionOf } from "@/types/domain";

/** Art-directed slide image: mobileImage below md. Only the first slide is eager / high priority (LCP). */
function SlideImage({ slide, first }: { slide: HeroSlide; first: boolean }) {
  const common = { alt: slide.imageAlt, fill: true, sizes: "100vw" } as const;
  const { props: { srcSet: desktop } } = getImageProps({ ...common, src: slide.image });
  const { props: mobile } = getImageProps({ ...common, src: slide.mobileImage ?? slide.image, loading: first ? "eager" : "lazy", fetchPriority: first ? "high" : undefined });
  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktop} sizes="100vw" />
      <img {...mobile} alt={slide.imageAlt} className="object-cover" />
    </picture>
  );
}

function Slide({ slide, first }: { slide: HeroSlide; first: boolean }) {
  const reduce = useReducedMotion();
  const light = slide.theme === "light";
  return (
    <div className="relative h-[72svh] min-h-[28rem] max-h-[52rem] overflow-hidden bg-surface-2">
      {/* slow ken-burns drift; static for reduced motion */}
      <motion.div className="absolute inset-0" initial={{ scale: 1 }} animate={reduce ? undefined : { scale: 1.06 }}
        transition={{ duration: 14, ease: "linear", repeat: Infinity, repeatType: "mirror" }}>
        <SlideImage slide={slide} first={first} />
      </motion.div>
      <div className={clsx("absolute inset-0 bg-linear-to-t", light ? "from-canvas/85 via-canvas/30 to-transparent" : "from-black/65 via-black/20 to-transparent")} aria-hidden />
      <div className={clsx("container-x absolute inset-x-0 bottom-0 pb-12 sm:pb-16", light ? "text-ink" : "text-on-dark")}>
        <motion.div className="max-w-2xl" initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.64, ease: [0.22, 1, 0.36, 1] }}>
          {slide.eyebrow && <p className="t-overline opacity-85">{slide.eyebrow}</p>}
          {first ? <h1 className="t-hero mt-3">{slide.heading}</h1> : <h2 className="t-hero mt-3">{slide.heading}</h2>}
          {slide.body && <p className="mt-4 max-w-lg text-body-lg opacity-90">{slide.body}</p>}
          {(slide.cta || slide.secondaryCta) && (
            <div className="mt-7 flex flex-wrap gap-3">
              {slide.cta && <ButtonLink href={slide.cta.href} variant={light ? "primary" : "accent"} size="lg">{slide.cta.label}</ButtonLink>}
              {slide.secondaryCta && (
                <ButtonLink href={slide.secondaryCta.href} variant="ghost" size="lg" className={light ? "border border-ink/40" : "border border-on-dark/60 text-on-dark hover:bg-on-dark hover:text-ink"}>
                  {slide.secondaryCta.label}
                </ButtonLink>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export function HeroCarousel({ section }: { section: HomeSectionOf<"hero_carousel"> }) {
  const { slides, autoplayMs } = section.config;
  if (!slides.length) return null;
  return (
    <Carousel label={section.title ?? homeCopy.slideshow} gap="0px" autoplay={slides.length > 1 ? (autoplayMs ?? 6500) : undefined} dots className="[&>ul]:rounded-none">
      {slides.map((s, i) => <Slide key={`${s.image}-${i}`} slide={s} first={i === 0} />)}
    </Carousel>
  );
}
