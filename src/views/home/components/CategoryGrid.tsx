import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { CategoryCard } from "./CategoryCard";
import { SectionHead } from "./SectionHead";

/** "Built for every squad": tall category tiles, 2 columns mobile / 3 desktop, each linking to its collection page. */
export function CategoryGrid({ section }: { section: HomeSectionOf<"category_grid"> }) {
  return (
    <section className="container-x section-y">
      <SectionHead overline={homeCopy.overline.categories} title={section.title} subtitle={section.subtitle} cta={{ label: homeCopy.viewAll, href: "/collections" }} />
      <Stagger as="ul" gap={0.08} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
        {section.categories.map((c, i) => (
          <StaggerItem as="li" key={c.id}><CategoryCard category={c} index={i} /></StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
