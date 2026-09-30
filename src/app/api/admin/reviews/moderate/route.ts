import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { moderateReviews } from "@/backend/admin/reviews";
import { ModerateSchema } from "@/backend/admin/schemas/marketing";

export const POST = route("admin.reviews", async ({ req }) => {
  const actor = await guard("reviews.moderate");
  return ok(await moderateReviews(actor, await parse(req, ModerateSchema)));
});
