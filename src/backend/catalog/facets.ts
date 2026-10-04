/** Filter facets computed from the products in scope (pure). */
import type { Category } from "@/types/domain";
import { descendantIds } from "./mapper";

export interface Facets {
  /** Children of the scoped category (roots when unscoped); counts include descendants. */
  categories: { id: string; slug: string; name: string; count: number }[];
  brands: { value: string; count: number }[];
  /** Option axes in first-seen order, e.g. Color -> [Black, White]. */
  options: { name: string; values: { value: string; colorHex?: string; count: number }[] }[];
  price: { min: number; max: number } | null;
}
export interface FacetRow {
  id: string; brand: string | null; category_id: string; price_min: number | null; option_names: string[] | null;
  fv: { option1: string | null; option2: string | null; option3: string | null; color_hex: string | null }[] | null;
}

export const EMPTY_FACETS: Facets = { categories: [], brands: [], options: [], price: null };

export function computeFacets(rows: FacetRow[], flat: Category[], scopeCategoryId?: string): Facets {
  const children = flat.filter((c) => c.parentId === (scopeCategoryId ?? null) && c.isActive);
  const categories = children
    .map((c) => {
      const ids = new Set(descendantIds(flat, c.id));
      return { id: c.id, slug: c.slug, name: c.name, count: rows.filter((r) => ids.has(r.category_id)).length };
    })
    .filter((c) => c.count > 0);

  const brandCount = new Map<string, number>();
  const axes = new Map<string, Map<string, { colorHex?: string; products: Set<string> }>>();
  let min = Infinity, max = -Infinity;
  for (const r of rows) {
    if (r.brand) brandCount.set(r.brand, (brandCount.get(r.brand) ?? 0) + 1);
    if (r.price_min !== null) { min = Math.min(min, r.price_min); max = Math.max(max, r.price_min); }
    (r.option_names ?? []).forEach((name, i) => {
      const axis = axes.get(name) ?? axes.set(name, new Map()).get(name)!;
      for (const v of r.fv ?? []) {
        const value = [v.option1, v.option2, v.option3][i];
        if (!value) continue;
        const entry = axis.get(value) ?? axis.set(value, { products: new Set() }).get(value)!;
        entry.products.add(r.id);
        if (v.color_hex && !entry.colorHex) entry.colorHex = v.color_hex;
      }
    });
  }
  return {
    categories,
    brands: [...brandCount].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value)),
    options: [...axes].map(([name, values]) => ({
      name,
      values: [...values].map(([value, e]) => ({ value, ...(e.colorHex ? { colorHex: e.colorHex } : {}), count: e.products.size })),
    })),
    price: rows.length && min !== Infinity ? { min, max } : null,
  };
}
