import { getStoreSettings } from "@/backend/settings/repo";
import { layoutCopy } from "@/data/storefront";
import { formatPrice } from "@/lib/format";

/** Slim uppercase line under the floating pill (store routes except home); renders nothing when there is nothing to announce. */
export async function AnnouncementBar() {
  const threshold = (await getStoreSettings())?.freeShippingThreshold;
  if (!threshold) return null;
  return <p className="t-overline px-4 pb-1 pt-2 text-center">{layoutCopy.freeShipping(formatPrice(threshold))}</p>;
}
