import "server-only";
import { cached, TAGS } from "@/backend/_core/cache";
import type { Session } from "@/backend/_core/auth";
import { must, publicDb, safe, userDb } from "@/backend/_core/db";
import { ApiError } from "@/backend/_core/http";
import { logger } from "@/lib/logger";
import type { Media, Paginated, RatingSummary, Review } from "@/types/domain";
import { ReviewListQuery, type SubmitReviewInput } from "./schema";

interface Row {
  id: string; product_id: string; rating: number; title: string; body: string; author_name: string; author_location: string | null;
  status: Review["status"]; verified_purchase: boolean; helpful_count: number; created_at: string;
  media: { url: string | null; storage_path: string | null; alt: string; sort_order: number }[] | null;
}
const COLS =
  "id, product_id, rating, title, body, author_name, author_location, status, verified_purchase, helpful_count, created_at, " +
  "media:review_media(url, storage_path, alt, sort_order)";
const ORDER: Record<ReviewListQuery["sort"], [string, boolean]> = {
  recent: ["created_at", false], high: ["rating", false], low: ["rating", true], helpful: ["helpful_count", false],
};

export type ReviewPage = Paginated<Review> & { summary: RatingSummary };

/** Approved reviews for a product, paginated, plus a rating histogram over all approved reviews. */
export const listProductReviews = cached("reviews.product", [TAGS.reviews], async (productId: string, input: Partial<ReviewListQuery> = {}): Promise<ReviewPage> => {
  const q = ReviewListQuery.parse(input);
  const summary: RatingSummary = { average: 0, count: 0, histogram: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const empty: ReviewPage = { items: [], total: 0, page: q.page, pageSize: q.pageSize, summary };
  const db = publicDb();
  if (!db) return empty;

  let list = db.from("reviews").select(COLS, { count: "exact" }).eq("product_id", productId).eq("status", "approved");
  if (q.rating) list = list.eq("rating", q.rating);
  const [col, asc] = ORDER[q.sort];
  const from = (q.page - 1) * q.pageSize;
  const [res, ratings] = await Promise.all([
    list.order(col, { ascending: asc }).order("created_at", { ascending: false }).range(from, from + q.pageSize - 1),
    // ponytail: histogram from the rating column; add a rollup table if a product passes ~50k reviews
    db.from("reviews").select("rating").eq("product_id", productId).eq("status", "approved").limit(50000),
  ]);
  const rows: Row[] = safe(res, "list reviews", []);
  for (const r of safe<{ rating: number }[]>(ratings, "review histogram", [])) {
    summary.histogram[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
    summary.count += 1;
    summary.average += r.rating;
  }
  summary.average = summary.count ? Math.round((summary.average / summary.count) * 10) / 10 : 0;

  // Uploaded review photos live in the private review-media bucket (readable once approved): sign them.
  const paths = rows.flatMap((r) => (r.media ?? []).flatMap((m) => (!m.url && m.storage_path ? [m.storage_path] : [])));
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await db.storage.from("review-media").createSignedUrls(paths, 3600);
    for (const s of data ?? []) if (s.path && s.signedUrl) signed.set(s.path, s.signedUrl);
  }
  const items = rows.map((r): Review => ({
    id: r.id, productId: r.product_id, author: r.author_name, authorLocation: r.author_location ?? undefined,
    rating: r.rating, title: r.title, body: r.body, verifiedPurchase: r.verified_purchase, status: r.status,
    helpfulCount: r.helpful_count, createdAt: r.created_at,
    images: [...(r.media ?? [])].sort((a, b) => a.sort_order - b.sort_order)
      .flatMap((m): Media[] => { const url = m.url ?? signed.get(m.storage_path ?? ""); return url ? [{ url, alt: m.alt }] : []; }),
  }));
  return { items, total: res.count ?? items.length, page: q.page, pageSize: q.pageSize, summary };
});

/**
 * Customer review. The DB trigger forces status=pending, source=customer and computes verified_purchase
 * from a delivered order. One review per user per product (409 on repeat).
 */
export async function submitReview(session: Session, input: SubmitReviewInput): Promise<{ id: string; status: "pending"; verifiedPurchase: boolean }> {
  const db = await userDb();
  const row = must<{ id: string; verified_purchase: boolean }>(
    await db.from("reviews").insert({
      product_id: input.productId, user_id: session.userId, rating: input.rating, title: input.title, body: input.body,
      author_name: input.authorName, author_location: input.authorLocation ?? null,
    }).select("id, verified_purchase").single(),
    "submit review",
  );
  logger.child({ svc: "reviews", userId: session.userId }).info("review.submitted", { reviewId: row.id, productId: input.productId });
  return { id: row.id, status: "pending", verifiedPurchase: row.verified_purchase };
}

/** Helpful / not helpful vote (one per user per review; re-voting overwrites). */
export async function voteReview(session: Session, reviewId: string, helpful: boolean): Promise<void> {
  const db = await userDb();
  const { error } = await db.from("review_votes")
    .upsert({ review_id: reviewId, user_id: session.userId, is_helpful: helpful }, { onConflict: "review_id,user_id" });
  if (error) {
    if (error.code === "23503") throw new ApiError(404, "review_not_found", "Review not found");
    must({ data: null, error }, "vote on review");
  }
}
