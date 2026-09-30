import type { Offer } from "@/data/admin/types";
import { formatPrice } from "@/lib/format";
import type { Collection } from "@/types/domain";

export function describeOffer(o: Offer, collections: Collection[]) {
  const col = (id: string) => collections.find((c) => c.id === id)?.name ?? "any collection";
  if (o.kind === "bundle") return `Any ${o.quantity} items from ${col(o.collectionId)} for ${formatPrice(o.price)}`;
  if (o.kind === "bogo") return `Buy ${o.buy}, get ${o.get} free from ${col(o.collectionId)} (cheapest item free)`;
  return o.tiers.map((t) => `${t.percentOff}% off over ${formatPrice(t.minSubtotal)}`).join(" · ");
}
