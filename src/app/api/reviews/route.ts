import { z } from "zod";
import { requireUser } from "@/backend/_core/auth";
import { ok, parse, route, searchParamsObject } from "@/backend/_core/http";
import { listProductReviews, submitReview } from "@/backend/reviews/repo";
import { ReviewListQuery, SubmitReviewSchema } from "@/backend/reviews/schema";

/** GET /api/reviews?productId=&page=&pageSize=&sort=recent|high|low|helpful&rating= */
export const GET = route("reviews", async ({ req }) => {
  const sp = searchParamsObject(req.nextUrl.searchParams);
  const productId = z.string().uuid().parse(sp.productId);
  return ok(await listProductReviews(productId, ReviewListQuery.parse(sp)));
});

/** POST /api/reviews (signed in) -> { id, status: "pending", verifiedPurchase } */
export const POST = route("reviews", async ({ req }) => {
  const session = await requireUser();
  return ok(await submitReview(session, await parse(req, SubmitReviewSchema)), { status: 201 });
});
