import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound } from "@/backend/admin/_shared";
import { deleteOffer, getOffer, updateOffer } from "@/backend/admin/marketing";
import { OfferPatchSchema } from "@/backend/admin/schemas/marketing";

type P = { id: string };

export const GET = route<P>("admin.offers", async ({ params }) => ok((await getOffer(params.id)) ?? notFound("Offer")));

export const PATCH = route<P>("admin.offers", async ({ req, params }) => {
  const actor = await guard("offers.write");
  return ok(await updateOffer(actor, params.id, await parse(req, OfferPatchSchema)));
});

export const DELETE = route<P>("admin.offers", async ({ params }) => {
  const actor = await guard("offers.write");
  return ok(await deleteOffer(actor, params.id));
});
