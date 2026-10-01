import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { CategoryCard } from "./CategoryCard";
import { HomeRail } from "./HomeRail";
import { SectionHead } from "./SectionHead";

// 1.2 cards mobile, 2 tablet, 3 desktop (gap-3 / sm:gap-4, see HomeRail). Three or fewer categories fit exactly on
// desktop, so the rail does not overflow there: no arrows, no autoplay, a static row. Mobile stays a swipe rail.
const ITEM = "basis-[82%] sm:basis-[calc((100%_-_1rem)/2)] lg:basis-[calc((100%_-_2rem)/3)]";

/** "Built for every squad": tall category tiles in an autoplaying, edge-bleeding rail, each linking to its collection page. */
export function CategoryGrid({ section }: { section: HomeSectionOf<"category_grid"> }) {
  return (
    <section className="@container section-y">
      <div className="container-x">
        <SectionHead overline={homeCopy.overline.categories} title={section.title} subtitle={section.subtitle} cta={{ label: homeCopy.viewAll, href: "/collections" }} />
        <HomeRail
          label={section.title ?? homeCopy.overline.categories} autoplay itemClassName={ITEM}
          labels={{ prev: homeCopy.categoryPrev, next: homeCopy.categoryNext }}
        >
          {section.categories.map((c, i) => <CategoryCard key={c.id} category={c} index={i} />)}
        </HomeRail>
      </div>
    </section>
  );
}
