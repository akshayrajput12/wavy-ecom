import type { Metadata } from "next";
import { getStoreSettings } from "@/backend/settings/repo";
import { cartCopy } from "@/data/copy";
import { CartView } from "@/views/cart/CartView";

export const metadata: Metadata = { title: cartCopy.title, robots: { index: false } };

export default async function CartRoute() {
  const settings = await getStoreSettings();
  return <CartView freeShippingThreshold={settings?.freeShippingThreshold} />;
}
