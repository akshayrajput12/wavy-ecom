import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { createOffer, listOffers } from "@/backend/admin/marketing";
import { OfferSchema } from "@/backend/admin/schemas/marketing";

export const GET = route("admin.offers", async () => ok(await listOffers()));

export const POST = route("admin.offers", async ({ req }) => {
  const actor = await guard("offers.write");
  return ok(await createOffer(actor, await parse(req, OfferSchema)), { status: 201 });
});
