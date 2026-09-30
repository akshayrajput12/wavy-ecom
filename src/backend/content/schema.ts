import { z } from "zod";

/** home_sections.config shapes (docs/database/SCHEMA.md "Home page"). Admin writes validate with these too. */
const uuid = z.string().uuid();
const Cta = z.object({ label: z.string().min(1).max(60), href: z.string().min(1).max(500) });
const Theme = z.enum(["light", "dark"]).optional();
const limit = z.number().int().min(1).max(48).optional();

export const HomeSectionConfig = {
  hero_carousel: z.object({
    autoplayMs: z.number().int().min(0).max(60000).optional(),
    slides: z.array(z.object({
      image: z.string().min(1), imageAlt: z.string(), mobileImage: z.string().optional(), eyebrow: z.string().optional(),
      heading: z.string().min(1), body: z.string().optional(), cta: Cta.optional(), secondaryCta: Cta.optional(), theme: Theme,
    })).min(1).max(10),
  }),
  category_grid: z.object({ categoryIds: z.array(uuid).optional(), limit }),
  collection_rail: z.object({ collectionIds: z.array(uuid).optional(), limit }),
  product_carousel: z.object({
    source: z.enum(["collection", "category", "featured", "new", "best_rated", "manual"]),
    collectionId: uuid.optional(), categoryId: uuid.optional(), productIds: z.array(uuid).optional(), limit, cta: Cta.optional(),
  }),
  floating_showcase: z.object({ productIds: z.array(uuid).min(1), image: z.string().optional(), imageAlt: z.string().optional(), cta: Cta.optional() }),
  promo_banner: z.object({
    image: z.string().min(1), imageAlt: z.string(), heading: z.string().min(1), body: z.string().optional(),
    couponCode: z.string().optional(), cta: Cta.optional(), theme: Theme,
  }),
  testimonials: z.object({ limit, testimonialIds: z.array(uuid).optional() }),
  blog_rail: z.object({ limit, categorySlug: z.string().optional() }),
  newsletter: z.object({
    heading: z.string().min(1), body: z.string().optional(), placeholder: z.string().optional(),
    buttonLabel: z.string().optional(), consentText: z.string().optional(),
  }),
} as const;
export type HomeSectionConfigs = { [K in keyof typeof HomeSectionConfig]: z.infer<(typeof HomeSectionConfig)[K]> };

export const BlogListQuery = z.object({
  page: z.coerce.number().int().min(1).max(500).catch(1),
  pageSize: z.coerce.number().int().min(1).max(48).catch(12),
  category: z.string().max(120).optional(),
  tag: z.string().max(120).optional(),
});
export type BlogListQuery = z.infer<typeof BlogListQuery>;
