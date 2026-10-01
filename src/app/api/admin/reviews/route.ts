import { ok, parse, route } from "@/backend/_core/http";
import { guard, query } from "@/backend/admin/_shared";
import { createReview, deleteReviews, listReviews } from "@/backend/admin/reviews";
import { ReviewDeleteSchema, ReviewListQuery, ReviewSchema } from "@/backend/admin/schemas/marketing";

export const GET = route("admin.reviews", async ({ req }) => ok(await listReviews(query(req, ReviewListQuery))));

/** Staff-authored review (source = admin; status / verified flag kept as given). */
export const POST = route("admin.reviews", async ({ req }) => {
  const actor = await guard("reviews.moderate");
  return ok(await createReview(actor, await parse(req, ReviewSchema)), { status: 201 });
});

/** Bulk hard delete: body `{ ids }` (1-200 uuids) -> `{ deleted }`. */
export const DELETE = route("admin.reviews", async ({ req }) => {
  const actor = await guard("reviews.moderate");
  return ok(await deleteReviews(actor, (await parse(req, ReviewDeleteSchema)).ids));
});
