import type { Metadata } from "next";
import { getSession } from "@/backend/_core/auth";
import { listWishlist } from "@/backend/account/repo";
import { wishlistCopy } from "@/data/copy";
import { WishlistView } from "@/views/wishlist/WishlistView";

export const metadata: Metadata = { title: wishlistCopy.title, robots: { index: false } };

export default async function WishlistRoute() {
  const session = await getSession();
  const saved = session ? await listWishlist(session).catch(() => null) : null;
  return <WishlistView signedIn={!!session} accountProducts={saved?.products ?? []} />;
}
