"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { ChevronRightIcon } from "@/components/ui/icons";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { collectionCopy, homeCopy } from "@/data/storefront";
import type { Category } from "@/types/domain";
import { CategoryCard } from "./CategoryCard";
import { HomeRail } from "./HomeRail";
import type { PlayState } from "./useRailAutoplay";

// 1.2 cards mobile, 2 tablet, 3 desktop (gap-3 / sm:gap-4, see HomeRail). Three or fewer cards fit exactly on
// desktop, so the rail does not overflow there: no arrows, no autoplay, a static row. Mobile stays a swipe rail.
const ITEM = "basis-[82%] sm:basis-[calc((100%_-_1rem)/2)] lg:basis-[calc((100%_-_2rem)/3)]";
const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out
// panel change: cross-fade + slide in the direction of the tab move (custom = +1 right / -1 left)
const panel: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE_OUT } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -24, transition: { duration: 0.2, ease: "easeIn" } }),
};

/**
 * Department tabs ("All · <parent> · …") over the category rail. "All" shows the parent tiles; a parent tab swaps
 * the rail to that parent's sub-category tiles. Tabs follow the WAI-ARIA pattern (arrow keys, Home/End, auto-activate).
 */
export function CategoryTabs({ categories, label }: { categories: Category[]; label: string }) {
  const reduce = useReducedMotion();
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const parents = categories.filter((c) => c.children?.length);
  const [{ active, dir }, setTab] = useState({ active: -1, dir: 1 }); // -1 = All
  const setActive = (next: number) => setTab((t) => ({ active: next, dir: next >= t.active ? 1 : -1 }));
  const playState = useState(true); // lives here: each tab mounts a fresh rail, and a pause must stick across tabs
  const current = parents[active];
  const cards = current ? current.children! : categories;

  if (!parents.length) return <Rail label={label} cards={categories} playState={playState} />;

  const options = [{ key: "all", name: homeCopy.categoryTabs.all }, ...parents.map((p) => ({ key: p.id, name: p.name }))];
  const onKey = (e: KeyboardEvent) => {
    const i = active + 1;
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: options.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const n = (next + options.length) % options.length;
    setActive(n - 1);
    tabs.current[n]?.focus();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div
          role="tablist" aria-label={homeCopy.categoryTabs.label} onKeyDown={onKey}
          className="-mx-(--gutter) flex w-[calc(100%_+_var(--gutter)_*_2)] gap-1 overflow-x-auto px-(--gutter) py-1 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:px-0"
        >
          {options.map((o, n) => {
            const selected = n === active + 1;
            return (
              <button
                key={o.key} ref={(el) => { tabs.current[n] = el; }} type="button" role="tab" id={`${id}-tab-${n}`}
                aria-selected={selected} aria-controls={`${id}-panel`} tabIndex={selected ? 0 : -1}
                onClick={() => setActive(n - 1)}
                className={clsx(
                  "relative inline-flex min-h-11 shrink-0 items-center rounded-pill border px-5 text-meta font-medium transition-colors duration-(--dur-fast) focus-visible:outline-offset-2",
                  selected ? "border-ink text-canvas" : "border-line text-ink hover:border-ink",
                )}
              >
                {selected && (
                  <motion.span layoutId={`${id}-pill`} aria-hidden className="absolute inset-0 rounded-pill bg-ink"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }} />
                )}
                <span className="relative">{o.name}</span>
              </button>
            );
          })}
        </div>
        {current && (
          <Link href={`/collections/${current.slug}`} className="group inline-flex min-h-11 items-center gap-1 text-meta font-medium underline decoration-line underline-offset-4 hover:decoration-ink">
            {collectionCopy.allIn(current.name)}
            <ChevronRightIcon className="size-3.5" />
          </Link>
        )}
      </div>

      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active + 1}`}>
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          {/* reduced motion: MotionConfig drops the slide, the short fade stays */}
          <motion.div key={current?.id ?? "all"} custom={dir} variants={panel} initial="enter" animate="center" exit="exit">
            <Rail label={current?.name ?? label} cards={cards} playState={playState} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Rail({ label, cards, playState }: { label: string; cards: Category[]; playState: PlayState }) {
  return (
    <HomeRail label={label} autoplay playState={playState} itemClassName={ITEM} labels={{ prev: homeCopy.categoryPrev, next: homeCopy.categoryNext }}>
      {cards.map((c, i) => <CategoryCard key={c.id} category={c} index={i} />)}
    </HomeRail>
  );
}
