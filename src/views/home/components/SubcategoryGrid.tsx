"use client";

import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { SectionHead } from "./SectionHead";
import { SubcategoryCircularTile } from "./SubcategoryCircularTile";

export function SubcategoryGrid({ section: s }: { section: HomeSectionOf<"subcategory_grid"> }) {
  const sourceTiles = s.tiles ?? [];
  if (!sourceTiles.length) return null;

  // Duplicate list dynamically if needed to ensure smooth infinite 2-row scrolling marquee
  const fullList = sourceTiles.length < 8 ? [...sourceTiles, ...sourceTiles, ...sourceTiles] : sourceTiles;
  const half = Math.ceil(fullList.length / 2);
  const row1 = fullList.slice(0, half);
  const row2 = fullList.slice(half);

  return (
    <section className="section-y bg-surface-2/30 border-y border-line-soft overflow-hidden">
      <div className="container-x pb-4">
        <SectionHead
          overline={homeCopy.subcategories.overline}
          title={s.title || "Explore Subcategories"}
          subtitle={s.subtitle || "Curated picks across all departments"}
          cta={{ label: homeCopy.viewAll, href: "/collections" }}
        />
      </div>

      {/* 2-Row Autoscrolling Marquee Carousel */}
      <div className="space-y-6 pt-2">
        {/* Row 1: Moving Left */}
        <div className="group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex shrink-0 animate-[marquee_35s_linear_infinite] gap-8 group-hover:[animation-play-state:paused]">
            {row1.map((t, idx) => (
              <SubcategoryCircularTile key={`r1-${t.id}-${idx}`} tile={t} index={idx} />
            ))}
          </div>
          <div className="flex shrink-0 animate-[marquee_35s_linear_infinite] gap-8 group-hover:[animation-play-state:paused]" aria-hidden="true">
            {row1.map((t, idx) => (
              <SubcategoryCircularTile key={`r1-dup-${t.id}-${idx}`} tile={t} index={idx} />
            ))}
          </div>
        </div>

        {/* Row 2: Moving Right */}
        <div className="group flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex shrink-0 animate-[marquee-reverse_38s_linear_infinite] gap-8 group-hover:[animation-play-state:paused]">
            {row2.map((t, idx) => (
              <SubcategoryCircularTile key={`r2-${t.id}-${idx}`} tile={t} index={idx + 4} />
            ))}
          </div>
          <div className="flex shrink-0 animate-[marquee-reverse_38s_linear_infinite] gap-8 group-hover:[animation-play-state:paused]" aria-hidden="true">
            {row2.map((t, idx) => (
              <SubcategoryCircularTile key={`r2-dup-${t.id}-${idx}`} tile={t} index={idx + 4} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
