"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { StaggerItem } from "@/components/ui/Reveal";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { homeCopy } from "@/data/storefront";
import { useRailAutoplay, type PlayState } from "./useRailAutoplay";

// active = filled ink, disabled = hairline outline (state is also exposed via the `disabled` attribute)
const btn = "grid size-11 place-items-center rounded-pill border transition-colors duration-(--dur-fast) enabled:border-ink enabled:bg-ink enabled:text-canvas enabled:hover:bg-ink/85 disabled:border-line disabled:text-ink-muted";

/**
 * Native scroll-snap rail. It bleeds to the viewport edge while its first card stays aligned to `.container-x`;
 * place it inside `.container-x` under a full-width `@container` ancestor (the bleed is measured in `cqw`).
 * `autoplay`: advances one card every 4s and loops, only while the rail overflows and motion is allowed (see useRailAutoplay).
 */
export function HomeRail({ children, label, autoplay, playState, itemClassName, labels }: {
  children: ReactNode; label: string; autoplay?: boolean;
  /** Parent-owned play/pause, so a shopper's pause survives this rail remounting. */
  playState?: PlayState;
  /** li width override (flex-basis), default ~4-5 product cards on desktop */
  itemClassName?: string; labels?: { prev: string; next: string };
}) {
  const ref = useRef<HTMLUListElement>(null);
  const reduce = useReducedMotion();
  const [edge, setEdge] = useState({ start: true, end: true });

  const measure = useCallback(() => {
    const el = ref.current;
    if (el) setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  /** Scrolls by one page of whole cards, or by one card. */
  const go = (dir: 1 | -1, one = false) => {
    const el = ref.current;
    const first = el?.querySelector("li");
    if (!el || !first) return;
    const css = getComputedStyle(el);
    const gap = Number.parseFloat(css.columnGap) || 0;
    const step = first.getBoundingClientRect().width + gap;
    const inner = el.clientWidth - 2 * (Number.parseFloat(css.paddingLeft) || 0);
    const count = one ? 1 : Math.max(1, Math.floor((inner + gap) / step));
    el.scrollBy({ left: dir * count * step, behavior: reduce ? "auto" : "smooth" });
  };
  const overflows = !(edge.start && edge.end);
  const showToggle = !!autoplay && overflows && !reduce;
  const auto = useRailAutoplay(ref, () => {
    const el = ref.current;
    if (el && el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) el.scrollTo({ left: 0, behavior: "smooth" }); // loop
    else go(1, true);
  }, showToggle, playState);
  const arrow = (dir: 1 | -1) => { auto.nudge(); go(dir); };

  return (
    <div>
      <motion.ul
        ref={ref}
        // cards stagger in once on scroll into view (and again when a CategoryTabs panel remounts the rail)
        initial={reduce ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
        tabIndex={0}
        aria-label={label}
        onScroll={measure}
        {...auto.handlers}
        className={clsx(
          "relative flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[--bleed:calc(max(0px,(100cqw_-_var(--container))/2)_+_var(--gutter))] -mx-(--bleed) px-(--bleed) scroll-px-(--bleed)",
          "rounded-md focus-visible:outline-offset-4",
        )}
      >
        {Children.toArray(children).map((child, i) => (
          <StaggerItem as="li" key={i} className={clsx("min-w-0 shrink-0 snap-start", itemClassName ?? "basis-[64%] sm:basis-[38%] lg:basis-[24%] xl:basis-[19%]")}>{child}</StaggerItem>
        ))}
      </motion.ul>
      {overflows && (
        <div className="mt-6 flex justify-end gap-2">
          {showToggle && (
            <button type="button" className={clsx(btn, "mr-auto")} onClick={auto.toggle} aria-label={auto.playing ? homeCopy.railPause : homeCopy.railPlay}>
              {auto.playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
            </button>
          )}
          <button type="button" className={btn} onClick={() => arrow(-1)} disabled={edge.start} aria-label={labels?.prev ?? homeCopy.railPrev}>
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button type="button" className={btn} onClick={() => arrow(1)} disabled={edge.end} aria-label={labels?.next ?? homeCopy.railNext}>
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
