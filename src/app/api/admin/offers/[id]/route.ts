import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound } from "@/backend/admin/_shared";
import { getOffer, updateOffer } from "@/backend/admin/marketing";
import { removeMany } from "@/backend/admin/remove";
import { OfferPatchSchema } from "@/backend/admin/schemas/marketing";

type P = { id: string };

export const GET = route<P>("admin.offers", async ({ params }) => ok((await getOffer(params.id)) ?? notFound("Offer")));

export const PATCH = route<P>("admin.offers", async ({ req, params }) => {
  const actor = await guard("offers.write");
  return ok(await updateOffer(actor, params.id, await parse(req, OfferPatchSchema)));
});

/** Same rules as the bulk DELETE -> `{deleted, archived}` (used ones are archived). */
export const DELETE = route<P>("admin.offers", async ({ params }) => {
  const actor = await guard("offers.write");
  return ok(await removeMany(actor, "offers", [params.id]));
});
