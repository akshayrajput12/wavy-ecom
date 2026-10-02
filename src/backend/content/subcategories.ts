import "server-only";
import { cached, TAGS } from "@/backend/_core/cache";
import { publicDb, safe } from "@/backend/_core/db";
import { descendantIds } from "@/backend/catalog/mapper";
import { categoryOffer, type OfferStats } from "@/backend/catalog/offer";
import type { Category, CategoryRef, SubcategoryTile } from "@/types/domain";
import type { HomeSectionConfigs } from "./schema";

type StatsRow = { category_id: string; price_min: number; max_discount_pct: number };

/** Offer stats for every category in one grouped read of the category_offer_stats view (0025). */
const listOfferStats = cached("catalog.offerStats", [TAGS.catalog], async (): Promise<StatsRow[]> => {
  const db = publicDb();
  if (!db) return [];
  return safe(await db.from("category_offer_stats").select("category_id, price_min, max_discount_pct"), "list category offers", []);
});

/**
 * subcategory_grid tiles. `categoryIds` picks tiles explicitly (in that order); otherwise every active child of
 * `parentIds` (default: the home departments, `show_on_home` roots), grouped by parent order. A tile's offer
 * rolls up its own and its descendants' products.
 */
export async function resolveSubcategoryGrid(c: HomeSectionConfigs["subcategory_grid"], flat: Category[]) {
  const byId = new Map(flat.map((x) => [x.id, x]));
  const parents = c.parentIds?.length ? c.parentIds.flatMap((id) => byId.get(id) ?? []) : flat.filter((x) => !x.parentId && x.showOnHome);
  const picked = c.categoryIds?.length
    ? c.categoryIds.flatMap((id) => byId.get(id) ?? [])
    : parents.flatMap((p) => flat.filter((x) => x.parentId === p.id));
  const list = picked.slice(0, c.limit ?? 24);

  const stats = new Map<string, OfferStats>();
  if (c.showOffer !== false) {
    for (const r of await listOfferStats()) stats.set(r.category_id, { priceMin: r.price_min, maxDiscountPct: r.max_discount_pct });
  }
  const tiles: SubcategoryTile[] = list.map(({ id, name, slug, parentId, image }) => ({
    id, name, slug, parentId, image,
    offer: categoryOffer(descendantIds(flat, id).flatMap((d) => stats.get(d) ?? [])),
  }));

  const tabs = new Map<string, CategoryRef>();
  for (const t of tiles) {
    const p = t.parentId ? byId.get(t.parentId) : undefined;
    if (p && !tabs.has(p.id)) tabs.set(p.id, { id: p.id, name: p.name, slug: p.slug });
  }
  return { tiles, parents: [...tabs.values()] };
}
