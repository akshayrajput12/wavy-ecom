"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion, useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { DragCursor } from "@/components/ui/DragCursor";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { useCallback, useId, useRef, useState } from "react";
import { homeCopy, homeStageCopy as copy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { CollectionCard } from "./CollectionCard";
import { HeadingLines } from "./HeadingLines";
import { itemStep, useDragScroll } from "./useDragScroll";

const pad = (n: number) => String(n).padStart(2, "0");
const circle = "grid size-11 place-items-center rounded-pill border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-canvas disabled:pointer-events-none disabled:opacity-40";
const SIZES = "(min-width: 1024px) 22vw, (min-width: 640px) 44vw, 72vw";
// while one panel is hovered the others dim (hover-capable pointers only, so a tap never leaves the rail dimmed)
const dimOthers = "[@media(hover:hover)]:[&:has(>li:hover)>li:not(:hover)]:opacity-40";

/**
 * "In the wild" lookbook: dark stage, edge-to-edge desaturated panels on native scroll + snap. Mouse: drag with
 * momentum, custom "‹ Drag ›" cursor, hover parallax/curtain, skew from scroll speed. Touch: native snap swipe.
 * Caption bar: active title, progress line, "01 / 08" counter and prev/next circles.
 */
export function CollectionRail({ section }: { section: HomeSectionOf<"collection_rail"> }) {
  const items = section.collections;
  const headingId = useId();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const drag = useDragScroll(ref);
  const { scrollX, scrollXProgress } = useScroll({ container: ref });
  const speed = useSpring(useVelocity(scrollX), { stiffness: 300, damping: 50 });
  const skewX = useTransform(speed, [-3000, 3000], [1.5, -1.5], { clamp: true }); // whole rail shears with scroll speed

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
    setActive(atEnd && el.scrollLeft > 2 ? items.length - 1 : Math.round(el.scrollLeft / itemStep(el)));
  }, [items.length]);
  const goTo = (i: number) => {
    const el = ref.current;
    const next = Math.min(Math.max(0, i), items.length - 1);
    setActive(next); // panels that can't scroll further (end of rail) still become active
    el?.scrollTo({ left: next * itemStep(el), behavior: reduce ? "auto" : "smooth" });
  };

  if (!items.length) return null;
  const current = items[Math.min(active, items.length - 1)];

  return (
    <section aria-labelledby={headingId} className="on-dark section-y">
      <div className="container-x flex items-end justify-between gap-6 pb-8 lg:pb-12">
        <div>
          <p className="t-overline">{section.subtitle ?? copy.lookbookOverline}</p>
          <HeadingLines id={headingId} line={section.title ?? homeCopy.slideshow} className="mt-4" />
        </div>
        <p className="t-overline shrink-0">{copy.lookbookCount(items.length)}</p>
      </div>

      <motion.ul ref={ref} tabIndex={0} aria-labelledby={headingId} onScroll={measure} {...drag} style={reduce ? undefined : { skewX }}
        className={clsx(
          "flex snap-x snap-proximity gap-0.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "focus-visible:outline-offset-[-4px] [&_a]:select-none [&_img]:pointer-events-none",
          dimOthers,
        )}>
        {items.map((c, i) => (
          <li key={c.id}
            className="h-[min(72svh,40rem)] shrink-0 grow basis-[72vw] snap-start transition-opacity duration-(--dur-base) ease-soft sm:basis-[44vw] lg:basis-[22vw]">
            <CollectionCard c={c} active={i === active} sizes={SIZES} onFocus={() => setActive(i)} />
          </li>
        ))}
      </motion.ul>
      <DragCursor target={ref} label={copy.drag} />

      <div className="container-x pt-6">
        <div className="h-px bg-line" aria-hidden>
          <motion.div className="h-full origin-left bg-ink" style={{ scaleX: scrollXProgress }} />
        </div>
      </div>
      <div className="container-x flex items-center justify-between gap-6 pt-5">
        {/* caption cross-fades up as the active panel changes */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={current.id} className="min-w-0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
            <p className="t-h2 truncate">{current.name}</p>
            {current.productCount ? <p className="t-overline mt-1">{homeCopy.products(current.productCount)}</p> : null}
          </motion.div>
        </AnimatePresence>
        <div className="flex shrink-0 items-center gap-2">
          <p className="t-index mr-2 text-ink-soft" aria-hidden><span className="text-ink">{pad(active + 1)}</span> / {pad(items.length)}</p>
          <button type="button" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label={copy.prevCollection} className={circle}>
            <ChevronLeftIcon className="size-4" />
          </button>
          <button type="button" onClick={() => goTo(active + 1)} disabled={active >= items.length - 1} aria-label={copy.nextCollection} className={circle}>
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
