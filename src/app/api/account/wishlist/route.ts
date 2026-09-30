import { requireUser } from "@/backend/_core/auth";
import { ok, parse, route } from "@/backend/_core/http";
import { addToWishlist, listWishlist, removeFromWishlist } from "@/backend/account/repo";
import { WishlistSchema } from "@/backend/account/schema";

export const GET = route("account.wishlist", async () => ok(await listWishlist(await requireUser())));

/** POST { productId, variantId? } */
export const POST = route("account.wishlist", async ({ req }) => {
  const session = await requireUser();
  await addToWishlist(session, await parse(req, WishlistSchema));
  return ok({ saved: true }, { status: 201 });
});

/** DELETE { productId, variantId? } (no variantId = every entry for the product) */
export const DELETE = route("account.wishlist", async ({ req }) => {
  const session = await requireUser();
  await removeFromWishlist(session, await parse(req, WishlistSchema));
  return ok({ removed: true });
});
