import "server-only";
import type { z } from "zod";
import type { AdminReview, Paginated } from "@/types/admin";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { logger } from "@/lib/logger";
import { type Actor, assertCan, audit, camel, db, maybe, must, notFound, pageRange, read, revalidate, searchTerm, snake, userDb } from "./_shared";
import type { ModerateSchema, ReviewListQuery, ReviewPatchSchema, ReviewSchema } from "./schemas/marketing";

const log = logger.child({ svc: "admin.reviews" });

async function withProducts(rows: Tables<"reviews">[]): Promise<AdminReview[]> {
  const ids = [...new Set(rows.map((r) => r.product_id))];
  const products = ids.length ? must(await db().from("products").select("id, name, slug").in("id", ids)) : [];
  const p = new Map(products.map((x) => [x.id, x]));
  return rows.map((r) => ({ ...camel(r), productName: p.get(r.product_id)?.name ?? null, productSlug: p.get(r.product_id)?.slug ?? null }));
}

export const listReviews = (q: z.infer<typeof ReviewListQuery>) =>
  read("reviews.moderate", { items: [], total: 0, page: q.page, pageSize: q.pageSize } as Paginated<AdminReview>, async () => {
    const [from, to] = pageRange(q.page, q.pageSize);
    let b = db().from("reviews").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (q.status) b = b.eq("status", q.status);
    if (q.productId) b = b.eq("product_id", q.productId);
    if (q.source) b = b.eq("source", q.source);
    if (q.rating) b = b.eq("rating", q.rating);
    const term = searchTerm(q.q);
    if (term) b = b.or(["title", "body", "author_name"].map((k) => `${k}.ilike."%${term}%"`).join(","));
    const res = await b.range(from, to);
    return { items: await withProducts(must(res)), total: res.count ?? 0, page: q.page, pageSize: q.pageSize };
  });

async function loadReview(id: string) {
  const row = maybe(await db().from("reviews").select("*").eq("id", id).maybeSingle());
  return row ? (await withProducts([row]))[0] : null;
}

/*
 * Writes use the session client: reviews_guard keeps every field for moderators (source 'admin', verified flag
 * as given) and stamps moderated_by = the staff user.
 */
export async function createReview(actor: Actor, input: z.infer<typeof ReviewSchema>) {
  const row = must(await (await userDb()).from("reviews")
    .insert({ ...snake<TablesInsert<"reviews">>(input), source: "admin", user_id: null }).select("*").single());
  await audit(actor, "review.create", "reviews", row.id, null, row);
  revalidate("catalog", "reviews");
  return (await withProducts([row]))[0];
}

export async function updateReview(actor: Actor, id: string, input: z.infer<typeof ReviewPatchSchema>) {
  const before = await loadReview(id);
  if (!before) notFound("Review");
  const row = must(await (await userDb()).from("reviews").update(snake<TablesUpdate<"reviews">>(input)).eq("id", id).select("*").single());
  await audit(actor, "review.update", "reviews", id, before, row);
  revalidate("catalog", "reviews");
  return (await withProducts([row]))[0];
}

async function uploadPaths(ids: string[]) {
  const rows = must(await db().from("review_media").select("storage_path").in("review_id", ids));
  return rows.flatMap((m) => (m.storage_path ? [m.storage_path] : []));
}

/**
 * Hard delete. review_media / review_votes cascade and the reviews_rollup_rating trigger (fires on DELETE)
 * recomputes products.rating_avg / review_count. Uploaded photos in the private bucket do not cascade, so
 * their paths are read first and removed once the rows are gone.
 */
export async function deleteReviews(actor: Actor, ids: string[]) {
  assertCan(actor, "reviews.moderate");
  const paths = await uploadPaths(ids);
  const rows = must(await (await userDb()).from("reviews").delete().in("id", ids).select("*"));
  if (!rows.length) notFound("Review");
  if (paths.length) {
    const { error } = await db().storage.from("review-media").remove(paths);
    // ponytail: rows are already gone; an orphaned photo is logged, not rolled back.
    if (error) log.error("review.media_delete_failed", error, { count: paths.length });
  }
  await audit(actor, "review.delete", "reviews", ids.length === 1 ? ids[0] : null, rows.length === 1 ? rows[0] : { reviews: rows }, null);
  revalidate("catalog", "reviews");
  log.info("review.deleted", { count: rows.length, actor: actor.userId });
  return { deleted: rows.length };
}

export async function moderateReviews(actor: Actor, { ids, status, note }: z.infer<typeof ModerateSchema>) {
  const rows = must(await (await userDb()).from("reviews").update({ status, moderation_note: note ?? null }).in("id", ids).select("id"));
  await audit(actor, "review.moderate", "reviews", null, null, { ids: rows.map((r) => r.id), status, note: note ?? null });
  revalidate("catalog", "reviews");
  return { updated: rows.length };
}
