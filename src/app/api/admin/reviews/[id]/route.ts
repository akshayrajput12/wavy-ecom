import { z } from "zod";
import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { deleteReviews, updateReview } from "@/backend/admin/reviews";
import { ReviewPatchSchema } from "@/backend/admin/schemas/marketing";

type P = { id: string };

export const PATCH = route<P>("admin.reviews", async ({ req, params }) => {
  const actor = await guard("reviews.moderate");
  return ok(await updateReview(actor, params.id, await parse(req, ReviewPatchSchema)));
});

export const DELETE = route<P>("admin.reviews", async ({ params }) => {
  const actor = await guard("reviews.moderate");
  const id = z.uuid().parse(params.id);
  await deleteReviews(actor, [id]);
  return ok({ id });
});
