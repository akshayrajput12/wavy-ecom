/** Sub-category offer line (home subcategory_grid). */
import type { CategoryOffer } from "@/types/domain";

/** One category_offer_stats row (0025): cheapest variant price (paise) and deepest compare-at discount %. */
export interface OfferStats { priceMin: number; maxDiscountPct: number }

/**
 * Rolls up the stats of a category and its descendants: "Up to N% off" (N rounded down to a multiple of 5)
 * when any variant is discounted by 5% or more, otherwise "From <min price>", nothing without products.
 */
export function categoryOffer(stats: OfferStats[]): CategoryOffer | undefined {
  if (!stats.length) return undefined;
  const pct = Math.floor(Math.max(...stats.map((s) => s.maxDiscountPct)) / 5) * 5;
  return pct >= 5 ? { kind: "discount", pct } : { kind: "from", price: Math.min(...stats.map((s) => s.priceMin)) };
}
