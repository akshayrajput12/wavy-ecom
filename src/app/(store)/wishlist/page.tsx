import type { Metadata } from "next";
import { getProducts } from "@/backend/catalog/repo";
import { wishlistCopy } from "@/data/content";
import { WishlistView } from "@/views/wishlist/WishlistView";

export const metadata: Metadata = { title: wishlistCopy.title, robots: { index: false } };

export default async function WishlistRoute() {
  // ponytail: ships the whole (small) catalogue so guest ids resolve client-side; switch to GET /api/wishlist when accounts sync it
  return <WishlistView products={await getProducts()} />;
}
