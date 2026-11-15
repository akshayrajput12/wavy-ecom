import { Store } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ScrollProgress } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/States";
import { TearReveal } from "@/components/ui/TearReveal";
import { homeCopy } from "@/data/storefront";
import type { Faq, HomeSection, Media, SubcategoryTile } from "@/types/domain";
import { BlogRail } from "./components/BlogRail";
import { CategoryGrid } from "./components/CategoryGrid";
import { CollectionRail } from "./components/CollectionRail";
import { FaqPreview } from "./components/FaqPreview";
import { FloatingShowcase } from "./components/FloatingShowcase";
import { HeroCarousel } from "./components/HeroCarousel";
import { NewsletterSection } from "./components/NewsletterSection";
import { ProductCarouselSection } from "./components/ProductCarouselSection";
import { PromoBanner } from "./components/PromoBanner";
import { SubcategoryGrid } from "./components/SubcategoryGrid";
import { Testimonials } from "./components/Testimonials";

function Section({ section: s, images }: { section: HomeSection; images: Media[] }) {
  switch (s.type) {
    case "hero_carousel": return <HeroCarousel section={s} />;
    case "category_grid": return <CategoryGrid section={s} />;
    case "subcategory_grid": return <SubcategoryGrid section={s} />;
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

function pageImages(sections: HomeSection[]): Media[] {
  return sections.flatMap((s) => {
    if (s.type === "category_grid") return s.categories.flatMap((c) => (c.image?.url ? [c.image] : []));
    if (s.type === "product_carousel") return s.products.flatMap((p) => (p.images[0]?.url ? [p.images[0]] : []));
    return [];
  });
}

export function HomeView({ sections, faqs = [] }: { sections: HomeSection[]; faqs?: Faq[] }) {
  if (!sections.length) {
    return (
      <div className="container-x section-y">
        <EmptyState icon={<Store className="size-7" aria-hidden />} title={homeCopy.empty.title} body={homeCopy.empty.body}
          action={<ButtonLink href="/collections" variant="secondary">{homeCopy.empty.cta}</ButtonLink>} />
      </div>
    );
  }

  // Extract real database subcategories directly from SQL category query data
  const categorySection = sections.find((s) => s.type === "category_grid") as Extract<HomeSection, { type: "category_grid" }> | undefined;
  const dbSubcategories: SubcategoryTile[] = categorySection?.categories.flatMap((c) => {
    const subs = c.children && c.children.length > 0 ? c.children : [c];
    return subs.map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      parentId: sub.parentId,
      image: sub.image,
    }));
  }) ?? [];

  const existingSubSection = sections.find((s) => s.type === "subcategory_grid") as Extract<HomeSection, { type: "subcategory_grid" }> | undefined;

  const resolvedSubSection: HomeSection = {
    id: existingSubSection?.id ?? "db-subcategory-grid",
    type: "subcategory_grid",
    title: existingSubSection?.title ?? "Explore Subcategories",
    subtitle: existingSubSection?.subtitle ?? "Curated picks across all departments",
    sortOrder: existingSubSection?.sortOrder ?? 2,
    config: existingSubSection?.config ?? { columns: 6, showOffer: true },
    tiles: existingSubSection?.tiles?.length ? existingSubSection.tiles : dbSubcategories,
  };

  const filteredSections = sections.filter((s) => s.type !== "subcategory_grid");
  const catIdx = filteredSections.findIndex((s) => s.type === "category_grid");

  let list: HomeSection[] = [];
  if (catIdx !== -1) {
    list = [
      ...filteredSections.slice(0, catIdx + 1),
      resolvedSubSection,
      ...filteredSections.slice(catIdx + 1),
    ];
  } else {
    list = [...filteredSections, resolvedSubSection];
  }

  const images = pageImages(list);
  const closing = list.at(-1)?.type === "newsletter" ? list.at(-1) : undefined;
  const body = closing ? list.slice(0, -1) : list;
  return (
    <>
      <ScrollProgress />
      {body.map((s) => <Section key={s.id} section={s} images={images} />)}
      <FaqPreview faqs={faqs} />
      {closing && <Section section={closing} images={images} />}
    </>
  );
}
