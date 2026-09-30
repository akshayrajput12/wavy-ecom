import { getStoreSettings, listShippingZones } from "@/backend/admin/repo";
import { ShippingView } from "@/views/admin/shipping/View";

export const metadata = { title: "Shipping" };

export default async function Page() {
  const [settings, zones] = await Promise.all([getStoreSettings(), listShippingZones()]);
  return <ShippingView settings={settings} zones={zones} />;
}
