"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { homeCopy } from "@/data/storefront";
import type { CategoryRef, SubcategoryTile as Tile } from "@/types/domain";
import { SubcategoryTile } from "./SubcategoryTile";

// 2 cols at 375, 3 at 768, then 4 or 6 at 1280+ (config.columns)
const GRID = {
  4: { cols: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4", sizes: "(min-width: 1280px) 23vw, (min-width: 768px) 31vw, 46vw" },
  6: { cols: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6", sizes: "(min-width: 1280px) 15vw, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 46vw" },
} as const;

/**
 * Optional department tabs ("All · Clothing · Shoes · …", only when tiles span 2+ parents) over a staggered tile grid.
 * Tabs follow the WAI-ARIA pattern used by CategoryTabs (arrow keys, Home/End, auto-activate).
 */
export function SubcategoryTabs({ parents, tiles, columns = 6 }: { parents: CategoryRef[]; tiles: Tile[]; columns?: 4 | 6 }) {
  const reduce = useReducedMotion();
  const id = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [active, setActive] = useState(0); // 0 = All
  const options = [{ id: "all", name: homeCopy.categoryTabs.all }, ...parents];
  const current = active ? parents[active - 1] : undefined;
  const shown = current ? tiles.filter((t) => t.parentId === current.id) : tiles;
  const grid = GRID[columns];

  const list = (
    <Stagger key={current?.id ?? "all"} as="ul" gap={0.05} className={clsx("grid gap-3 sm:gap-4", grid.cols)}>
      {shown.map((t) => <StaggerItem key={t.id} as="li"><SubcategoryTile tile={t} sizes={grid.sizes} /></StaggerItem>)}
    </Stagger>
  );
  if (parents.length < 2) return list;

  const onKey = (e: KeyboardEvent) => {
    const next = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: options.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const n = (next + options.length) % options.length;
    setActive(n);
    tabs.current[n]?.focus();
  };

  return (
    <div>
      <div
        role="tablist" aria-label={homeCopy.subcategories.tabs} onKeyDown={onKey}
        className="-mx-(--gutter) mb-6 flex w-[calc(100%_+_var(--gutter)_*_2)] gap-1 overflow-x-auto px-(--gutter) py-1 [scrollbar-width:none] sm:mx-0 sm:w-auto sm:px-0"
      >
        {options.map((o, n) => {
          const selected = n === active;
          return (
            <button
              key={o.id} ref={(el) => { tabs.current[n] = el; }} type="button" role="tab" id={`${id}-tab-${n}`}
              aria-selected={selected} aria-controls={`${id}-panel`} tabIndex={selected ? 0 : -1} onClick={() => setActive(n)}
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
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}>{list}</div>
    </div>
  );
}
