import { getShipping } from "@/backend/admin/repo";
import { ShippingView } from "@/views/admin/shipping/View";

export const metadata = { title: "Shipping" };

export default async function Page() {
  return <ShippingView settings={await getShipping()} />;
}
