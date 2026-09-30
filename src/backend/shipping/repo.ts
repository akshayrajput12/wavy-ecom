import "server-only";
import { cached, TAGS } from "@/backend/_core/cache";
import { publicDb, safe } from "@/backend/_core/db";
import type { ShippingMethod } from "@/types/domain";

interface Row {
  id: string; code: string; name: string; description: string | null; rate: number; free_above: number | null;
  cod_available: boolean; min_days: number; max_days: number; sort_order: number;
  zone: { states: string[]; is_default: boolean } | null;
}

/**
 * Active shipping methods for a state: zones listing the state win, else the default zone (same rule as
 * compute_pricing). Without `state` every active method is returned. Final shipping cost comes from the quote.
 */
export const listShippingMethods = cached("shipping.methods", [TAGS.shipping], async (state?: string): Promise<ShippingMethod[]> => {
  const db = publicDb();
  if (!db) return [];
  const rows: Row[] = safe(
    await db.from("shipping_methods")
      .select("id, code, name, description, rate, free_above, cod_available, min_days, max_days, sort_order, zone:shipping_zones!inner(states, is_default)")
      .order("sort_order").order("rate"),
    "list shipping methods", [],
  );
  const s = state?.trim().toLowerCase();
  const inState = s ? rows.filter((r) => r.zone?.states.some((x) => x.toLowerCase() === s)) : [];
  const chosen = s ? (inState.length ? inState : rows.filter((r) => r.zone?.is_default)) : rows;
  return chosen.map((r) => ({
    id: r.id, code: r.code, name: r.name, description: r.description ?? undefined, rate: r.rate,
    freeAbove: r.free_above ?? undefined, codAvailable: r.cod_available, minDays: r.min_days, maxDays: r.max_days,
  }));
});
