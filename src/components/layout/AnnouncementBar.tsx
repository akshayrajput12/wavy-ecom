import { getStoreSettings } from "@/backend/settings/repo";
import { layoutCopy } from "@/data/storefront";
import { formatPrice } from "@/lib/format";

/** Thin calm strip above the header, from store settings; renders nothing when there is nothing to announce. */
export async function AnnouncementBar() {
  const threshold = (await getStoreSettings())?.freeShippingThreshold;
  if (!threshold) return null;
  return <p className="bg-accent-soft px-4 py-2 text-center text-micro font-medium text-ink">{layoutCopy.freeShipping(formatPrice(threshold))}</p>;
}
