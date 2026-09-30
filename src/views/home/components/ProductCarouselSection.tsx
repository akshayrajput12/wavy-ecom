import { ProductRail } from "@/components/commerce/ProductGrid";
import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { SectionHead } from "./SectionHead";

export function ProductCarouselSection({ section }: { section: HomeSectionOf<"product_carousel"> }) {
  return (
    <section className="container-x section-y">
      <SectionHead title={section.title} subtitle={section.subtitle} cta={section.config.cta} />
      <ProductRail products={section.products} label={section.title ?? homeCopy.slideshow} />
    </section>
  );
}
