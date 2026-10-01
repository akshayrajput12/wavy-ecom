import { Store } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { TearReveal } from "@/components/ui/TearReveal";
import { homeCopy } from "@/data/storefront";
import type { Faq, HomeSection, Media } from "@/types/domain";
import { BlogRail } from "./components/BlogRail";
import { CategoryGrid } from "./components/CategoryGrid";
import { CollectionRail } from "./components/CollectionRail";
import { FaqPreview } from "./components/FaqPreview";
import { FloatingShowcase } from "./components/FloatingShowcase";
import { HeroCarousel } from "./components/HeroCarousel";
import { NewsletterSection } from "./components/NewsletterSection";
import { ProductCarouselSection } from "./components/ProductCarouselSection";
import { PromoBanner } from "./components/PromoBanner";
import { Testimonials } from "./components/Testimonials";

function Section({ section: s, images }: { section: HomeSection; images: Media[] }) {
  switch (s.type) {
    case "hero_carousel": return <HeroCarousel section={s} />;
    case "category_grid": return <CategoryGrid section={s} />;
    case "collection_rail": return <CollectionRail section={s} />;
    case "product_carousel": return <ProductCarouselSection section={s} />;
    case "floating_showcase": return <FloatingShowcase section={s} />;
    case "promo_banner": return <PromoBanner section={s} />;
    case "testimonials": return <Testimonials section={s} images={images} />;
    case "blog_rail": return <BlogRail section={s} />;
    case "newsletter": return <NewsletterSection section={s} />;
    case "tear_reveal": return <TearReveal {...s.config} />;
  }
}

/** Storefront imagery already on the page (category + product shots), used to fill the testimonials mosaic. */
function pageImages(sections: HomeSection[]): Media[] {
  return sections.flatMap((s) => {
    if (s.type === "category_grid") return s.categories.flatMap((c) => (c.image?.url ? [c.image] : []));
    if (s.type === "product_carousel") return s.products.flatMap((p) => (p.images[0]?.url ? [p.images[0]] : []));
    return [];
  });
}

/**
 * Home is entirely admin-defined: sections render in the order getHomeSections() returns. No wrapper or top padding,
 * so the first section (the hero) sits flush under the floating header. The FAQ preview goes near the end, before a
 * closing newsletter band if there is one.
 */
export function HomeView({ sections, faqs = [] }: { sections: HomeSection[]; faqs?: Faq[] }) {
  if (!sections.length) {
    return (
      <div className="container-x section-y">
        <EmptyState icon={<Store className="size-7" aria-hidden />} title={homeCopy.empty.title} body={homeCopy.empty.body}
          action={<ButtonLink href="/collections" variant="secondary">{homeCopy.empty.cta}</ButtonLink>} />
      </div>
    );
  }
  const images = pageImages(sections);
  const closing = sections.at(-1)?.type === "newsletter" ? sections.at(-1) : undefined;
  const body = closing ? sections.slice(0, -1) : sections;
  return (
    <>
      {body.map((s) => <Section key={s.id} section={s} images={images} />)}
      <FaqPreview faqs={faqs} />
      {closing && <Section section={closing} images={images} />}
    </>
  );
}
