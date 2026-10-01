import { ProductCard } from "@/components/commerce/ProductCard";
import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { HomeRail } from "./HomeRail";
import { SectionHead } from "./SectionHead";

const SIZES = "(min-width: 1280px) 19vw, (min-width: 1024px) 24vw, (min-width: 640px) 38vw, 64vw";

/** "Team favourites": heading row + edge-bleeding product rail. `@container` lets the rail measure its bleed. */
export function ProductCarouselSection({ section }: { section: HomeSectionOf<"product_carousel"> }) {
  return (
    <section className="@container section-y">
      <div className="container-x">
        <SectionHead overline={homeCopy.overline.products[section.config.source]} title={section.title} subtitle={section.subtitle} cta={section.config.cta} />
        <HomeRail label={section.title ?? homeCopy.slideshow}>
          {section.products.map((p) => <ProductCard key={p.id} product={p} sizes={SIZES} />)}
        </HomeRail>
      </div>
    </section>
  );
}
