import { sortOptions } from "../../../data/content";
import type { ProductFilters, SortId } from "../../../backend/catalog/repo";

export type SearchParams = Record<string, string | string[] | undefined>;
/** URL keys → shopper refinements. Multi-values are comma-separated: ?size=M,L&color=Black */
export const FILTER_KEYS = ["category", "size", "color", "material", "price", "stock"] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const list = (v: string | string[] | undefined) => one(v).split(",").map((s) => s.trim()).filter(Boolean);

export function parseFilters(sp: SearchParams): ProductFilters {
  const sort = one(sp.sort);
  return {
    categories: list(sp.category),
    sizes: list(sp.size),
    colors: list(sp.color),
    materials: list(sp.material),
    price: one(sp.price) || undefined,
    inStock: one(sp.stock) === "1",
    sort: sortOptions.some((o) => o.id === sort) ? (sort as SortId) : undefined,
  };
}

/** Flattens Next's searchParams to plain strings so client components can rebuild hrefs. */
export const flatParams = (sp: SearchParams): Record<string, string> =>
  Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, one(v)]).filter(([, v]) => v));

export function withParam(params: Record<string, string>, key: string, values: string[]): string {
  const next = new URLSearchParams(params);
  if (values.length) next.set(key, values.join(","));
  else next.delete(key);
  const s = next.toString();
  return s ? `?${s}` : "?";
}
