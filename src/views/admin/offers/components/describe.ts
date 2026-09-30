import { formatPrice } from "@/lib/format";
import type { AdminOffer } from "@/types/admin";

/** One-line summary of what an offer does. */
export function describeOffer(o: AdminOffer) {
  if (o.type === "bundle_fixed_price") return `Any ${o.requiredQty ?? "?"} items for ${o.bundlePrice != null ? formatPrice(o.bundlePrice) : "?"}`;
  if (o.type === "bogo") return `Buy ${o.buyQty ?? "?"}, get ${o.getQty ?? "?"} at ${o.getDiscountPercent ?? "?"}% off`;
  return (o.tiers ?? []).map((t) => `${t.percent}% off ${t.minQty}+ items`).join(" · ") || "No tiers";
}
