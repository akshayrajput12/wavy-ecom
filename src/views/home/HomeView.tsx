import { Store } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { homeCopy } from "@/data/storefront";
import type { HomeSection } from "@/types/domain";
import { BlogRail } from "./components/BlogRail";
import { CategoryGrid } from "./components/CategoryGrid";
import { CollectionRail } from "./components/CollectionRail";
import { FloatingShowcase } from "./components/FloatingShowcase";
import { HeroCarousel } from "./components/HeroCarousel";
import { NewsletterSection } from "./components/NewsletterSection";
import { ProductCarouselSection } from "./components/ProductCarouselSection";
import { PromoBanner } from "./components/PromoBanner";
import { Testimonials } from "./components/Testimonials";

function Section({ section: s }: { section: HomeSection }) {
  switch (s.type) {
    case "hero_carousel": return <HeroCarousel section={s} />;
    case "category_grid": return <CategoryGrid section={s} />;
    case "collection_rail": return <CollectionRail section={s} />;
    case "product_carousel": return <ProductCarouselSection section={s} />;
    case "floating_showcase": return <FloatingShowcase section={s} />;
    case "promo_banner": return <PromoBanner section={s} />;
    case "testimonials": return <Testimonials section={s} />;
    case "blog_rail": return <BlogRail section={s} />;
    case "newsletter": return <NewsletterSection section={s} />;
  }
}

/** Home is entirely admin-defined: sections render in the order getHomeSections() returns. */
export function HomeView({ sections }: { sections: HomeSection[] }) {
  if (!sections.length) {
    return (
      <div className="container-x section-y">
        <EmptyState icon={<Store className="size-7" aria-hidden />} title={homeCopy.empty.title} body={homeCopy.empty.body}
          action={<ButtonLink href="/collections" variant="secondary">{homeCopy.empty.cta}</ButtonLink>} />
      </div>
    );
  }
  return <>{sections.map((s) => <Section key={s.id} section={s} />)}</>;
}
