import { homeCopy } from "@/data/storefront";
import { plainText } from "@/lib/format";
import type { HomeSectionOf } from "@/types/domain";
import { CategoryTabs } from "./CategoryTabs";
import { SectionHead } from "./SectionHead";

/** "Built for every squad": department tabs over tall category tiles in an autoplaying, edge-bleeding rail. */
export function CategoryGrid({ section }: { section: HomeSectionOf<"category_grid"> }) {
  return (
    <section className="@container section-y">
      <div className="container-x">
        <SectionHead overline={homeCopy.overline.categories} title={section.title} subtitle={section.subtitle} cta={{ label: homeCopy.viewAll, href: "/collections" }} />
        <CategoryTabs categories={section.categories} label={section.title ? plainText(section.title) : homeCopy.overline.categories} />
      </div>
    </section>
  );
}
