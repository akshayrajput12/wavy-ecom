"use client";

import type { ComponentType } from "react";
import { adminCopy } from "@/data/copy";
import type { HomeSectionType } from "@/types/domain";
import { FloatingMock, NewsletterMock, PromoMock, TearMock } from "./PreviewBands";
import { HeroMock } from "./PreviewHero";
import type { MockProps } from "./PreviewParts";
import { BlogMock, CategoryMock, CollectionMock, ProductMock, SubcategoryMock, TestimonialsMock } from "./PreviewRails";

const t = adminCopy.homeSections;
const MOCK: Record<HomeSectionType, ComponentType<MockProps>> = {
  hero_carousel: HeroMock, category_grid: CategoryMock, collection_rail: CollectionMock, product_carousel: ProductMock,
  floating_showcase: FloatingMock, promo_banner: PromoMock, testimonials: TestimonialsMock, blog_rail: BlogMock,
  newsletter: NewsletterMock, tear_reveal: TearMock, subcategory_grid: SubcategoryMock,
};

/**
 * Lightweight mini mock of what the storefront renders for this section, drawn from the live (unsaved) form values.
 * Brand look, not the real components (no motion, no data fetching). Sticky beside the form on xl, stacked below it.
 */
export function Preview({ type, ...props }: MockProps & { type: HomeSectionType }) {
  const Mock = MOCK[type];
  return (
    <figure className="w-full min-w-0 max-w-md self-start xl:sticky xl:top-24 xl:max-w-none">
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2">
        <span className="t-overline">{t.preview}</span>
        <span className="text-micro text-ink-soft">{t.previewNote}</span>
      </figcaption>
      <div className="overflow-hidden rounded-lg border border-line bg-canvas text-ink"><Mock {...props} /></div>
    </figure>
  );
}
