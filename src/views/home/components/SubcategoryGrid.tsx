import { clsx } from "clsx";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { SectionHead } from "./SectionHead";
import { SubcategoryTile } from "./SubcategoryTile";

// 2 cols at 375, 3 at 768, then 4 or 6 at 1280+ (config.columns)
const GRID = {
  4: { cols: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4", sizes: "(min-width: 1280px) 23vw, (min-width: 768px) 31vw, 46vw" },
  6: { cols: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6", sizes: "(min-width: 1280px) 15vw, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 46vw" },
} as const;

/** "Shop the edit": every sub-category, across all departments, in one staggered tile grid with a server-computed offer line. */
export function SubcategoryGrid({ section: s }: { section: HomeSectionOf<"subcategory_grid"> }) {
  const grid = GRID[s.config.columns ?? 6];
  return (
    <section className="section-y">
      <div className="container-x">
        <SectionHead overline={homeCopy.subcategories.overline} title={s.title} subtitle={s.subtitle} cta={{ label: homeCopy.viewAll, href: "/collections" }} />
        <Stagger as="ul" gap={0.05} className={clsx("grid gap-3 sm:gap-4", grid.cols)}>
          {s.tiles.map((t) => <StaggerItem key={t.id} as="li"><SubcategoryTile tile={t} sizes={grid.sizes} /></StaggerItem>)}
        </Stagger>
      </div>
    </section>
  );
}
