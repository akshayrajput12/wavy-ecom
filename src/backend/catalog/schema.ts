import { z } from "zod";

export const PRODUCT_SORTS = ["featured", "newest", "price-asc", "price-desc", "rating"] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

const list = z.preprocess((v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]), z.array(z.string().trim().min(1).max(80)).max(30));
const flag = z.preprocess((v) => v === true || v === "1" || v === "true", z.boolean());
const paise = z.coerce.number().int().min(0).optional();

/**
 * PLP / search query. URL form: ?category=audio&collection=best-sellers&opt=Color:Black&opt=Size:M
 * &brand=Tonic&min=50000&max=300000&inStock=1&sort=price-asc&q=earbuds&page=2&pageSize=24 (prices in paise).
 */
export const ProductQuerySchema = z.object({
  category: z.string().trim().max(120).optional(),
  collection: z.string().trim().max(120).optional(),
  /** "Name:Value" (or bare "Value"); matched on value across a product's option axes. */
  opt: list,
  brand: list,
  min: paise,
  max: paise,
  inStock: flag,
  sort: z.enum(PRODUCT_SORTS).catch("featured"),
  q: z.string().trim().max(100).optional().transform((s) => s || undefined),
  page: z.coerce.number().int().min(1).max(500).catch(1),
  pageSize: z.coerce.number().int().min(1).max(60).catch(24),
});
export type ProductQuery = z.infer<typeof ProductQuerySchema>;

/** Build a ProductQuery from Next `searchParams` (page props) or URLSearchParams (route handlers). */
export function productQueryFrom(sp: URLSearchParams | Record<string, string | string[] | undefined>, overrides: Partial<Record<keyof ProductQuery, unknown>> = {}): ProductQuery {
  const obj: Record<string, string | string[] | undefined> = {};
  if (sp instanceof URLSearchParams) for (const k of new Set(sp.keys())) { const all = sp.getAll(k); obj[k] = all.length > 1 ? all : all[0]; }
  else Object.assign(obj, sp);
  return ProductQuerySchema.parse({ ...obj, ...overrides });
}

/** Keeps search input safe for PostgREST logic trees (commas/parens/quotes are syntax). */
export const searchTerm = (q: string) => q.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
