import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { setRatingOverride } from "@/backend/admin/product-save";
import { RatingOverrideSchema } from "@/backend/admin/schemas/catalog";

/** Marketing override of the displayed rating / review count; send nulls to clear. */
export const PATCH = route<{ slug: string }>("admin.products", async ({ req, params }) => {
  const actor = await guard("reviews.moderate");
  return ok(await setRatingOverride(actor, params.slug, await parse(req, RatingOverrideSchema)));
});
