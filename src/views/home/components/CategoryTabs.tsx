"use client";

import { useState } from "react";
import { homeCopy } from "@/data/storefront";
import type { Category } from "@/types/domain";
import { CategoryCard } from "./CategoryCard";
import { HomeRail } from "./HomeRail";
import type { PlayState } from "./useRailAutoplay";

const ITEM = "basis-[82%] sm:basis-[calc((100%_-_1rem)/2)] lg:basis-[calc((100%_-_2rem)/3)]";

/**
 * Main categories rail showing ONLY main categories cleanly without subcategory tab swapping.
 */
export function CategoryTabs({ categories, label }: { categories: Category[]; label: string }) {
  const playState = useState(true);

  return (
    <div>
      <Rail label={label} cards={categories} playState={playState} />
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
