/**
 * DB rows -> domain types for the catalog. Pure (no server-only) so vitest can cover it.
 * Column lists live here next to the row shapes they produce. NEVER select product_variants.cost_price
 * (not granted to anon/authenticated) and never use `*` on variants.
 */
import type {
  Category, CategoryRef, Collection, Media, OptionValue, Product, ProductSpecification, ProductVariant, Seo,
} from "@/types/domain";

export const VARIANT_COLS =
  "id, product_id, sku, option1, option2, option3, title, color_hex, price, compare_at_price, status, position, inventory!inventory_variant_id_fkey(available)";
export const MEDIA_COLS = "id, variant_id, option_value, url, alt, width, height, position, is_primary";
const SEO_COLS = "seo_title, seo_description, og_image_url, canonical_url, noindex";
const CARD_COLS =
  "id, slug, name, brand, short_description, highlights, tags, badges, option_names, category_id, status, is_featured, " +
  "returnable, return_window_days, price_min, compare_at_min, rating_display, review_count_display, sort_order, published_at";
const DETAIL_COLS =
  "description, specifications, weight_grams, length_mm, width_mm, height_mm, hsn_code, country_of_origin, warranty, " + SEO_COLS;
const EMBEDS =
  `category:categories!products_category_id_fkey(id, name, slug), variants:product_variants!product_variants_product_id_fkey(${VARIANT_COLS}), ` +
  `media:product_media!product_media_product_id_fkey(${MEDIA_COLS}), memberships:collection_products!collection_products_product_id_fkey(collection_id)`;
/** Product cards / lists (no long description). */
export const PRODUCT_CARD_SELECT = `${CARD_COLS}, ${EMBEDS}`;
/** PDP. */
export const PRODUCT_DETAIL_SELECT = `${CARD_COLS}, ${DETAIL_COLS}, ${EMBEDS}`;
export const CATEGORY_COLS =
  `id, parent_id, name, slug, description, image_url, image_alt, banner_url, banner_alt, sort_order, is_active, show_on_home, ${SEO_COLS}`;
export const COLLECTION_COLS =
  `id, name, slug, description, image_url, image_alt, banner_url, banner_alt, sort_order, show_on_home, starts_at, ends_at, ${SEO_COLS}`;

type Nullable<T> = { [K in keyof T]: T[K] | null };
interface SeoRow { seo_title?: string | null; seo_description?: string | null; og_image_url?: string | null; canonical_url?: string | null; noindex?: boolean | null }

export interface VariantRow {
  id: string; product_id: string; sku: string; option1: string | null; option2: string | null; option3: string | null;
  title: string; color_hex: string | null; price: number; compare_at_price: number | null;
  status: ProductVariant["status"]; position: number;
  /** One-to-one embed; PostgREST returns an object (older versions: an array). */
  inventory: { available: number | null } | { available: number | null }[] | null;
}
export interface MediaRow {
  id: string; variant_id: string | null; option_value: string | null; url: string; alt: string;
  width: number | null; height: number | null; position: number; is_primary: boolean;
}
export interface ProductRow extends SeoRow, Partial<Nullable<{
  description: string; specifications: unknown; weight_grams: number; length_mm: number; width_mm: number; height_mm: number;
  hsn_code: string; country_of_origin: string; warranty: string;
}>> {
  id: string; slug: string; name: string; brand: string | null; short_description: string; highlights: string[] | null;
  tags: string[] | null; badges: string[] | null; option_names: string[] | null; category_id: string;
  status: Product["status"]; is_featured: boolean; returnable: boolean; return_window_days: number | null;
  price_min: number | null; compare_at_min: number | null; rating_display: number | null; review_count_display: number | null;
  category: CategoryRef | null; variants: VariantRow[] | null; media: MediaRow[] | null;
  memberships: { collection_id: string }[] | null;
}
export interface CategoryRow extends SeoRow {
  id: string; parent_id: string | null; name: string; slug: string; description: string | null;
  image_url: string | null; image_alt: string | null; banner_url: string | null; banner_alt: string | null;
  sort_order: number; is_active: boolean; show_on_home: boolean;
}
export interface CollectionRow extends SeoRow {
  id: string; name: string; slug: string; description: string | null; image_url: string | null; image_alt: string | null;
  banner_url: string | null; banner_alt: string | null; sort_order: number; show_on_home: boolean;
  starts_at: string | null; ends_at: string | null; product_count?: { count: number }[] | null;
}

const opt = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);

export function toMedia(url: string | null | undefined, alt: string | null | undefined, width?: number | null, height?: number | null): Media | undefined {
  if (!url) return undefined;
  const m: Media = { url, alt: alt ?? "" };
  if (width) m.width = width;
  if (height) m.height = height;
  return m;
}

export function toSeo(r: SeoRow): Seo | undefined {
  const seo: Seo = {
    title: opt(r.seo_title), description: opt(r.seo_description), ogImage: opt(r.og_image_url),
    canonical: opt(r.canonical_url), noindex: r.noindex || undefined,
  };
  return Object.values(seo).some((v) => v !== undefined) ? seo : undefined;
}

function available(inv: VariantRow["inventory"]): number {
  const row = Array.isArray(inv) ? inv[0] : inv;
  return Math.max(0, row?.available ?? 0);
}

export function toSpecifications(raw: unknown): ProductSpecification[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((s): ProductSpecification[] => {
    if (!s || typeof s !== "object") return [];
    const { group, label, value } = s as Record<string, unknown>;
    if (typeof label !== "string" || value === undefined || value === null) return [];
    return [{ ...(typeof group === "string" && group ? { group } : {}), label, value: String(value) }];
  });
}

/** Line/variant image: exact variant -> option value -> primary -> first. */
export function variantImage(v: Pick<VariantRow, "id" | "option1" | "option2" | "option3">, media: MediaRow[]): Media | undefined {
  const values = [v.option1, v.option2, v.option3].filter(Boolean);
  const hit = media.find((m) => m.variant_id === v.id) ?? media.find((m) => m.option_value && values.includes(m.option_value));
  return hit ? toMedia(hit.url, hit.alt, hit.width, hit.height) : undefined;
}

export function toVariant(v: VariantRow, optionNames: string[], media: MediaRow[]): ProductVariant {
  const values = [v.option1, v.option2, v.option3];
  const options: OptionValue[] = optionNames.flatMap((name, i) => (values[i] ? [{ name, value: values[i]! }] : []));
  return {
    id: v.id, productId: v.product_id, sku: v.sku, title: v.title, options,
    colorHex: opt(v.color_hex), price: v.price, compareAt: opt(v.compare_at_price),
    stock: v.status === "disabled" ? 0 : available(v.inventory), status: v.status, image: variantImage(v, media),
  };
}

export function toProduct(r: ProductRow): Product {
  const optionNames = r.option_names ?? [];
  const media = [...(r.media ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position);
  const variants = [...(r.variants ?? [])]
    .filter((v) => v.status !== "disabled")
    .sort((a, b) => a.position - b.position)
    .map((v) => toVariant(v, optionNames, media));
  const dims = { lengthMm: opt(r.length_mm), widthMm: opt(r.width_mm), heightMm: opt(r.height_mm) };
  return {
    id: r.id, slug: r.slug, name: r.name, brand: opt(r.brand),
    shortDescription: r.short_description ?? "", description: r.description ?? "",
    highlights: r.highlights ?? [], specifications: toSpecifications(r.specifications), tags: r.tags ?? [],
    categoryId: r.category_id, category: r.category ?? undefined,
    collectionIds: (r.memberships ?? []).map((m) => m.collection_id),
    optionNames, images: media.map((m) => toMedia(m.url, m.alt, m.width, m.height)!),
    badges: r.badges ?? [], status: r.status, isFeatured: r.is_featured,
    weightGrams: opt(r.weight_grams), dimensions: Object.values(dims).some((d) => d !== undefined) ? dims : undefined,
    hsnCode: opt(r.hsn_code), countryOfOrigin: opt(r.country_of_origin), warranty: opt(r.warranty),
    returnable: r.returnable, returnWindowDays: opt(r.return_window_days),
    rating: Number(r.rating_display ?? 0), reviewCount: r.review_count_display ?? 0,
    priceFrom: r.price_min ?? variants[0]?.price ?? 0, compareAtFrom: opt(r.compare_at_min),
    variants, seo: toSeo(r),
  };
}

export function toCategory(r: CategoryRow): Category {
  return {
    id: r.id, name: r.name, slug: r.slug, parentId: r.parent_id, description: opt(r.description),
    image: toMedia(r.image_url, r.image_alt), banner: toMedia(r.banner_url, r.banner_alt),
    sortOrder: r.sort_order, isActive: r.is_active, showOnHome: r.show_on_home, seo: toSeo(r),
  };
}

export function toCollection(r: CollectionRow): Collection {
  return {
    id: r.id, name: r.name, slug: r.slug, description: opt(r.description),
    image: toMedia(r.image_url, r.image_alt), banner: toMedia(r.banner_url, r.banner_alt),
    sortOrder: r.sort_order, showOnHome: r.show_on_home, startsAt: opt(r.starts_at), endsAt: opt(r.ends_at),
    productCount: r.product_count?.[0]?.count, seo: toSeo(r),
  };
}

/** Flat list -> tree (roots first, children sorted). Returns roots; every node has `children`. */
export function buildTree(flat: Category[]): Category[] {
  const byId = new Map(flat.map((c) => [c.id, { ...c, children: [] as Category[] }]));
  const roots: Category[] = [];
  for (const c of byId.values()) {
    const parent = c.parentId ? byId.get(c.parentId) : undefined;
    (parent ? parent.children! : roots).push(c);
  }
  const sort = (list: Category[]) => {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    list.forEach((c) => sort(c.children!));
  };
  sort(roots);
  return roots;
}

/** Self + all descendants' ids (PLP of a parent category). */
export function descendantIds(flat: Pick<Category, "id" | "parentId">[], rootId: string): string[] {
  const out = [rootId];
  for (let i = 0; i < out.length; i++) for (const c of flat) if (c.parentId === out[i]) out.push(c.id);
  return out;
}

/** Root -> ... -> parent of `id` (excludes self). */
export function ancestors(flat: Category[], id: string): Category[] {
  const byId = new Map(flat.map((c) => [c.id, c]));
  const out: Category[] = [];
  for (let c = byId.get(byId.get(id)?.parentId ?? ""); c && out.length < 10; c = byId.get(c.parentId ?? "")) out.unshift(c);
  return out;
}
