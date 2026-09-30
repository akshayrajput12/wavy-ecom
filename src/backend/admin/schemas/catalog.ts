/**
 * Catalog inputs (client-safe: reuse in admin forms via zodResolver). Money = integer paise.
 * Optional fields: omit = keep (PATCH) / DB default (create); send null to clear.
 */
import { z } from "zod";
import { PRODUCT_STATUS } from "@/types/domain";
import type { AdminProduct } from "@/types/admin";
import { SLUG_RE, SKU_RE, variantIssues } from "./rules";

export const text = (max: number) => z.string().trim().max(max);
export const optText = (max: number) => text(max).nullable().optional();
export const url = z.string().trim().min(1).max(2048);
export const optUrl = url.nullable().optional();
export const slug = z.string().trim().min(1).max(120).regex(SLUG_RE, "Use lowercase letters, numbers and single hyphens");
export const optInt = (min = 0, max = 2_147_483_647) => z.number().int().min(min).max(max).nullable().optional();
export const isoDate = z.iso.datetime({ offset: true }).nullable().optional();

export const seoShape = {
  seoTitle: optText(70), seoDescription: optText(170), ogImageUrl: optUrl, canonicalUrl: optUrl, noindex: z.boolean().optional(),
};

export const SpecificationSchema = z.object({ group: text(60).optional(), label: text(80).min(1), value: text(500).min(1) });

export const VariantInputSchema = z.object({
  id: z.uuid().optional(),
  sku: z.string().trim().toUpperCase().regex(SKU_RE, "3-64 chars: A-Z, 0-9 and -"),
  barcode: z.string().trim().min(6).max(64).nullable().optional(),
  /** Values in optionNames order ([] when the product has no options). */
  options: z.array(text(60).min(1)).max(3).default([]),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().nullable().optional(),
  costPrice: optInt(),
  weightGrams: optInt(1),
  lowStockThreshold: optInt(),
  disabled: z.boolean().default(false),
  /** New variants only: opening stock (ledger reason 'initial'). Existing stock changes go through /inventory/adjust. */
  initialStock: z.number().int().min(0).max(1_000_000).optional(),
});

export const MediaInputSchema = z.object({
  id: z.uuid().optional(),
  url,
  storagePath: z.string().max(512).nullable().optional(),
  alt: text(200).default(""),
  mediaType: z.enum(["image", "video"]).default("image"),
  width: optInt(1), height: optInt(1),
  isPrimary: z.boolean().default(false),
  /** Image of one exact variant (by SKU, so new variants can be referenced)… */
  variantSku: z.string().trim().toUpperCase().nullable().optional(),
  /** …or of every variant with this option value ("Black"). */
  optionValue: text(60).nullable().optional(),
});

/** Full product document for POST /products and PATCH /products/:slug (variants/media/collections are replaced). */
export const ProductUpsertSchema = z.object({
  name: text(140).min(1),
  slug,
  categoryId: z.uuid(),
  brand: optText(80),
  shortDescription: text(300).default(""),
  description: z.string().max(50_000).default(""),
  highlights: z.array(text(200).min(1)).max(20).default([]),
  specifications: z.array(SpecificationSchema).max(100).default([]),
  tags: z.array(text(40).min(1)).max(40).default([]),
  badges: z.array(text(30).min(1)).max(5).default([]),
  optionNames: z.array(text(30).min(1)).max(3).default([]),
  sizeChart: z.record(z.string(), z.unknown()).nullable().optional(),
  weightGrams: optInt(1), lengthMm: optInt(1), widthMm: optInt(1), heightMm: optInt(1),
  hsnCode: z.string().regex(/^[0-9]{4,8}$/, "4-8 digit HSN").nullable().optional(),
  countryOfOrigin: text(60).min(1).default("India"),
  warranty: optText(200),
  returnable: z.boolean().default(true),
  returnWindowDays: optInt(0, 90),
  returnPolicy: optText(2000),
  status: z.enum(PRODUCT_STATUS).default("draft"),
  isFeatured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  ...seoShape,
  collectionIds: z.array(z.uuid()).max(50).default([]),
  variants: z.array(VariantInputSchema).min(1, "Add at least one variant").max(250),
  media: z.array(MediaInputSchema).max(50).default([]),
}).superRefine((p, ctx) => {
  for (const i of variantIssues(p.optionNames, p.variants)) {
    ctx.addIssue({ code: "custom", path: i.index < 0 ? ["optionNames"] : ["variants", i.index], message: i.message });
  }
  const skus = new Set(p.variants.map((v) => v.sku));
  const values = new Set(p.variants.flatMap((v) => v.options));
  p.media.forEach((m, i) => {
    if (m.variantSku && !skus.has(m.variantSku)) ctx.addIssue({ code: "custom", path: ["media", i, "variantSku"], message: "Unknown variant SKU" });
    if (m.optionValue && !values.has(m.optionValue)) ctx.addIssue({ code: "custom", path: ["media", i, "optionValue"], message: "No variant has this option value" });
  });
});
export type ProductUpsert = z.infer<typeof ProductUpsertSchema>;
export type ProductUpsertInput = z.input<typeof ProductUpsertSchema>;

/** GET /products/:slug detail → editable document (what PATCH expects back). */
export function toProductInput(p: AdminProduct): ProductUpsertInput {
  const skuById = new Map(p.variants.map((v) => [v.id, v.sku]));
  return {
    name: p.name, slug: p.slug, categoryId: p.categoryId, brand: p.brand, shortDescription: p.shortDescription,
    description: p.description, highlights: p.highlights, specifications: p.specifications, tags: p.tags, badges: p.badges,
    optionNames: p.optionNames, sizeChart: p.sizeChart, weightGrams: p.weightGrams, lengthMm: p.lengthMm, widthMm: p.widthMm,
    heightMm: p.heightMm, hsnCode: p.hsnCode, countryOfOrigin: p.countryOfOrigin, warranty: p.warranty, returnable: p.returnable,
    returnWindowDays: p.returnWindowDays, returnPolicy: p.returnPolicy, status: p.status, isFeatured: p.isFeatured,
    sortOrder: p.sortOrder, seoTitle: p.seoTitle, seoDescription: p.seoDescription, ogImageUrl: p.ogImageUrl,
    canonicalUrl: p.canonicalUrl, noindex: p.noindex, collectionIds: p.collectionIds,
    variants: p.variants.map((v) => ({
      id: v.id, sku: v.sku, barcode: v.barcode, options: v.options, colorHex: v.colorHex, price: v.price,
      compareAtPrice: v.compareAtPrice, costPrice: v.costPrice, weightGrams: v.weightGrams,
      lowStockThreshold: v.lowStockThreshold, disabled: v.status === "disabled",
    })),
    media: p.media.map((m) => ({
      id: m.id, url: m.url, storagePath: m.storagePath, alt: m.alt, mediaType: m.mediaType === "video" ? "video" : "image",
      width: m.width, height: m.height, isPrimary: m.isPrimary, optionValue: m.optionValue,
      variantSku: m.variantId ? skuById.get(m.variantId) ?? null : null,
    })),
  };
}

export const ProductListQuery = z.object({
  q: z.string().max(100).optional(),
  status: z.enum(PRODUCT_STATUS).optional(),
  categoryId: z.uuid().optional(),
  collectionId: z.uuid().optional(),
  stock: z.enum(["in_stock", "low", "out"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type ProductListQuery = z.infer<typeof ProductListQuery>;

export const BulkStatusSchema = z.object({ ids: z.array(z.uuid()).min(1).max(200), status: z.enum(PRODUCT_STATUS) });
export const RatingOverrideSchema = z.object({
  ratingOverride: z.number().min(0).max(5).multipleOf(0.1).nullable(),
  reviewCountOverride: z.number().int().min(0).nullable(),
});

// ---------- Categories / collections ----------
const mediaShape = { description: optText(5000), imageUrl: optUrl, imageAlt: optText(200), bannerUrl: optUrl, bannerAlt: optText(200) };

export const CategorySchema = z.object({
  name: text(80).min(1), slug, parentId: z.uuid().nullable().optional(), ...mediaShape,
  sortOrder: z.number().int().optional(), isActive: z.boolean().optional(), showOnHome: z.boolean().optional(), ...seoShape,
});
export const CategoryPatchSchema = CategorySchema.partial();
export const CategoryReorderSchema = z.object({
  items: z.array(z.object({ id: z.uuid(), parentId: z.uuid().nullable(), sortOrder: z.number().int() })).min(1).max(500),
});

const CollectionShape = z.object({
  name: text(80).min(1), slug, ...mediaShape,
  sortOrder: z.number().int().optional(), isActive: z.boolean().optional(), showOnHome: z.boolean().optional(),
  startsAt: isoDate, endsAt: isoDate, ...seoShape,
});
const windowOk = (c: { startsAt?: string | null; endsAt?: string | null }) => !c.startsAt || !c.endsAt || c.endsAt > c.startsAt;
export const CollectionSchema = CollectionShape.refine(windowOk, { path: ["endsAt"], message: "End must be after start" });
export const CollectionPatchSchema = CollectionShape.partial().refine(windowOk, { path: ["endsAt"], message: "End must be after start" });
export const MembershipSchema = z.object({ productIds: z.array(z.uuid()).min(1).max(500) });

export const SlugCheckQuery = z.object({
  entity: z.enum(["product", "category", "collection"]), slug, excludeId: z.uuid().optional(),
});
