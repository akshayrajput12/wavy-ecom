"use client";

import { clsx } from "clsx";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { homeCopy } from "@/data/storefront";

// active = filled ink, disabled = hairline outline (state is also exposed via the `disabled` attribute)
const btn = "grid size-11 place-items-center rounded-pill border transition-colors duration-(--dur-fast) enabled:border-ink enabled:bg-ink enabled:text-canvas enabled:hover:bg-ink/85 disabled:border-line disabled:text-ink-muted";

/**
 * Native scroll-snap rail. It bleeds to the viewport edge while its first card stays aligned to `.container-x`;
 * place it inside `.container-x` under a full-width `@container` ancestor (the bleed is measured in `cqw`).
 */
export function HomeRail({ children, label }: { children: ReactNode; label: string }) {
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

  const go = (dir: 1 | -1) => {
    const el = ref.current;
    const first = el?.querySelector("li");
    if (!el || !first) return;
    const css = getComputedStyle(el);
    const gap = Number.parseFloat(css.columnGap) || 0;
    const step = first.getBoundingClientRect().width + gap;
    const inner = el.clientWidth - 2 * (Number.parseFloat(css.paddingLeft) || 0);
    const count = Math.max(1, Math.floor((inner + gap) / step));
    el.scrollBy({ left: dir * count * step, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div>
      <ul
        ref={ref}
        tabIndex={0}
        aria-label={label}
        onScroll={measure}
        className={clsx(
          "flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "[--bleed:calc(max(0px,(100cqw_-_var(--container))/2)_+_var(--gutter))] -mx-(--bleed) px-(--bleed) scroll-px-(--bleed)",
          "rounded-md focus-visible:outline-offset-4",
        )}
      >
        {Children.toArray(children).map((child, i) => (
          <li key={i} className="shrink-0 basis-[64%] snap-start sm:basis-[38%] lg:basis-[24%] xl:basis-[19%]">{child}</li>
        ))}
      </ul>
      {!(edge.start && edge.end) && (
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btn} onClick={() => go(-1)} disabled={edge.start} aria-label={homeCopy.railPrev}>
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button type="button" className={btn} onClick={() => go(1)} disabled={edge.end} aria-label={homeCopy.railNext}>
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
