/** Home sections, blog, FAQs, testimonials, content pages, SEO overrides and redirects (client-safe). */
import { z } from "zod";
import { HOME_SECTION_TYPE, type HomeSectionType } from "@/types/domain";
import { isoDate, optText, optUrl, seoShape, slug, text, url } from "./catalog";

const cta = z.object({ label: text(40).min(1), href: z.string().trim().min(1).max(500) });
const ids = z.array(z.uuid()).max(50);
const limit = z.number().int().min(1).max(24).optional();
const theme = z.enum(["light", "dark"]).optional();

/** home_sections.config per type (docs/database/SCHEMA.md). */
export const HOME_CONFIG = {
  hero_carousel: z.object({
    autoplayMs: z.number().int().min(2000).max(30000).optional(),
    slides: z.array(z.object({
      image: url, imageAlt: text(200), mobileImage: url.optional(), eyebrow: text(60).optional(), heading: text(120).min(1),
      body: text(300).optional(), cta: cta.optional(), secondaryCta: cta.optional(), theme,
    })).min(1).max(10),
  }),
  category_grid: z.object({ categoryIds: ids.optional(), limit }),
  collection_rail: z.object({ collectionIds: ids.optional(), limit }),
  product_carousel: z.object({
    source: z.enum(["collection", "category", "featured", "new", "best_rated", "manual"]),
    collectionId: z.uuid().optional(), categoryId: z.uuid().optional(), productIds: ids.optional(), limit, cta: cta.optional(),
  }).superRefine((c, ctx) => {
    if (c.source === "collection" && !c.collectionId) ctx.addIssue({ code: "custom", path: ["collectionId"], message: "Pick a collection" });
    if (c.source === "category" && !c.categoryId) ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Pick a category" });
    if (c.source === "manual" && !c.productIds?.length) ctx.addIssue({ code: "custom", path: ["productIds"], message: "Pick products" });
  }),
  floating_showcase: z.object({ productIds: ids.min(1), image: url.optional(), imageAlt: text(200).optional(), cta: cta.optional() }),
  promo_banner: z.object({
    image: url, imageAlt: text(200), heading: text(120).min(1), body: text(300).optional(),
    couponCode: z.string().max(32).optional(), cta: cta.optional(), theme,
  }),
  testimonials: z.object({ limit, testimonialIds: ids.optional() }),
  blog_rail: z.object({ limit, categorySlug: slug.optional() }),
  newsletter: z.object({
    heading: text(120).min(1), body: text(300).optional(), placeholder: text(60).optional(),
    buttonLabel: text(30).optional(), consentText: text(300).optional(),
  }),
  tear_reveal: z.object({
    word: text(24).min(1), tagline: text(60).optional(), variant: z.enum(["tiger", "image"]).optional(),
    image: url.optional(), imageAlt: text(200).optional(), cta: cta.optional(),
  }).refine((c) => c.variant !== "image" || !!c.image, { path: ["image"], message: "Add an image for the photo reveal" }),
} satisfies Record<HomeSectionType, z.ZodType>;

/** Validate + strip a config for its section type; throws ZodError (→ 422) with config.* paths. */
export function parseHomeConfig(type: HomeSectionType, config: unknown) {
  const r = HOME_CONFIG[type].safeParse(config);
  if (!r.success) throw new z.ZodError(r.error.issues.map((i) => ({ ...i, path: ["config", ...i.path] })));
  return r.data as Record<string, unknown>;
}

const windowOk = (v: { startsAt?: string | null; endsAt?: string | null }) => !v.startsAt || !v.endsAt || v.endsAt > v.startsAt;
const sectionShape = {
  title: optText(120), subtitle: optText(300), sortOrder: z.number().int().optional(), isActive: z.boolean().optional(),
  startsAt: isoDate, endsAt: isoDate,
};
export const HomeSectionSchema = z.object({ type: z.enum(HOME_SECTION_TYPE), config: z.unknown(), ...sectionShape })
  .refine(windowOk, { path: ["endsAt"], message: "End must be after start" })
  .transform((s) => ({ ...s, config: parseHomeConfig(s.type, s.config) }));
/** type cannot change; config is re-validated against the stored type. */
export const HomeSectionPatchSchema = z.object({ config: z.unknown().optional(), ...sectionShape })
  .refine(windowOk, { path: ["endsAt"], message: "End must be after start" });

export const ReorderSchema = z.object({ ids: z.array(z.uuid()).min(1).max(500) });
/** DELETE body for every admin bulk delete. */
export const BulkDeleteSchema = z.object({ ids: z.array(z.uuid()).min(1).max(200) });

// ---------- Blog ----------
const blogShape = z.object({
  title: text(160).min(1), slug, excerpt: text(500).optional(), coverUrl: optUrl, coverAlt: text(200).optional(),
  body: z.string().max(200_000).optional(), status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  scheduledFor: isoDate, authorName: text(80).min(1).optional(), categoryId: z.uuid().nullable().optional(),
  readingMinutes: z.number().int().positive().nullable().optional(), ...seoShape,
  jsonLd: z.record(z.string(), z.unknown()).nullable().optional(),
  tags: z.array(text(40).min(1)).max(20).optional(),
});
const scheduled = (b: { status?: string; scheduledFor?: string | null }) => b.status !== "scheduled" || !!b.scheduledFor;
export const BlogPostSchema = blogShape.refine(scheduled, { path: ["scheduledFor"], message: "Pick a publish time" });
export const BlogPostPatchSchema = blogShape.partial().refine(scheduled, { path: ["scheduledFor"], message: "Pick a publish time" });
export const BlogListQuery = z.object({
  status: z.enum(["draft", "scheduled", "published", "archived"]).optional(), q: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

// ---------- Simple content tables ----------
const faqShape = z.object({
  category: z.enum(["general", "orders", "shipping", "returns", "payments", "products", "account"]).optional(),
  question: text(300).min(1), answer: text(5000).min(1), sortOrder: z.number().int().optional(), isPublished: z.boolean().optional(),
});
export const FaqSchema = faqShape;
export const FaqPatchSchema = faqShape.partial();

const testimonialShape = z.object({
  authorName: text(80).min(1), authorRole: optText(80), quote: text(600).min(1), avatarUrl: optUrl,
  rating: z.number().int().min(1).max(5).nullable().optional(), productId: z.uuid().nullable().optional(),
  isPublished: z.boolean().optional(), sortOrder: z.number().int().optional(),
});
export const TestimonialSchema = testimonialShape;
export const TestimonialPatchSchema = testimonialShape.partial();

const pageShape = z.object({
  slug, pageType: z.enum(["about", "faq", "lookbook", "policy", "landing", "custom"]), title: text(160).min(1),
  blocks: z.array(z.record(z.string(), z.unknown())).max(100).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(), ...seoShape,
});
export const ContentPageSchema = pageShape;
export const ContentPagePatchSchema = pageShape.partial();

const seoOverrideShape = z.object({
  path: z.string().trim().regex(/^\//, "Starts with /").max(500),
  title: optText(70), description: optText(170), ogTitle: optText(120), ogDescription: optText(300),
  ogImageUrl: optUrl, canonicalUrl: optUrl, noindex: z.boolean().optional(), nofollow: z.boolean().optional(),
  jsonLd: z.record(z.string(), z.unknown()).nullable().optional(),
});
export const SeoOverrideSchema = seoOverrideShape;
export const SeoOverridePatchSchema = seoOverrideShape.partial();

const redirectShape = z.object({
  fromPath: z.string().trim().regex(/^\//, "Starts with /").max(500),
  toPath: z.string().trim().regex(/^(\/|https?:\/\/)/, "A path or http(s) URL").max(2000),
  statusCode: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]).optional(),
  isActive: z.boolean().optional(),
});
const distinct = (r: { fromPath?: string; toPath?: string }) => !r.fromPath || r.fromPath !== r.toPath;
export const RedirectSchema = redirectShape.refine(distinct, { path: ["toPath"], message: "Cannot redirect to itself" });
export const RedirectPatchSchema = redirectShape.partial().refine(distinct, { path: ["toPath"], message: "Cannot redirect to itself" });
