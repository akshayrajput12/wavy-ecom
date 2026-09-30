import type { Metadata } from "next";
import { getProducts } from "@/backend/catalog/repo";
import { bundleOffer, cartCopy } from "@/data/content";
import { CartView } from "@/views/cart/CartView";

export const metadata: Metadata = { title: cartCopy.title, robots: { index: false } };

export default async function CartRoute() {
  const [bundle, top] = await Promise.all([getProducts({ collectionId: bundleOffer.collectionId }), getProducts({ inStock: true, sort: "rating" })]);
  return <CartView bundleIds={bundle.map((p) => p.id)} crossSells={[...bundle, ...top.slice(0, 6)]} />;
}
