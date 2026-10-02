import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { SectionHead } from "./SectionHead";
import { SubcategoryTabs } from "./SubcategoryTabs";

/** "Shop the edit": sub-category tiles with a server-computed offer line, optional department tabs. */
export function SubcategoryGrid({ section: s }: { section: HomeSectionOf<"subcategory_grid"> }) {
  return (
    <section className="section-y">
      <div className="container-x">
        <SectionHead overline={homeCopy.subcategories.overline} title={s.title} subtitle={s.subtitle} cta={{ label: homeCopy.viewAll, href: "/collections" }} />
        <SubcategoryTabs parents={s.parents} tiles={s.tiles} columns={s.config.columns} />
      </div>
    </section>
  );
}
