import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, ok, parse, route } from "@/backend/_core/http";
import type { Permission } from "@/backend/_core/permissions";
import { logger } from "@/lib/logger";
import { type Actor, assertCan, audit, type CacheTag, db, exec, guard, must, notFound, revalidate } from "./_shared";
import { mediaPaths, pruneContentMedia } from "./contentMedia";
import { RESOURCES, type ResourceName } from "./crud";
import { BulkDeleteSchema } from "./schemas/content";

type Row = Record<string, unknown>;
type Files = { bucket: string; paths: string[] };

/**
 * One bulk-delete rule per admin resource. Orders, payments, refunds, invoices, customers, staff and the audit
 * log are deliberately absent: they are financial, legal or security records and are never deleted from admin.
 */
interface RemoveSpec {
  entity: string; table: string; perm: Permission; tags: CacheTag[];
  /** Explicit columns plus embedded `(count)`s that keep / block read. */
  select: string;
  /** Row is referenced by order history: soft-delete it with `soft` instead of deleting. */
  keep?: (row: Row) => boolean;
  soft?: Row; softPerm?: Permission;
  /** Refuse the whole request (409) when deleting would corrupt other data. */
  block?: (rows: Row[]) => ApiError | null;
  /** Runs right before the hard delete (e.g. reparent child categories). */
  before?: (ids: string[]) => Promise<void>;
  /** Storage objects owned by the rows; read before the delete because the media rows cascade. */
  files?: (rows: Row[]) => Promise<Files[]>;
  /** Shared content-media URLs in the deleted rows: removed only once nothing else references them. */
  media?: (row: Row) => unknown;
}

const log = logger.child({ svc: "admin.remove" });
const from = (table: string) => (db() as unknown as SupabaseClient).from(table);
/** Embedded PostgREST `rel(count)` -> number. */
export const count = (v: unknown) => (Array.isArray(v) ? Number((v[0] as { count?: number } | undefined)?.count ?? 0) : 0);
const label = (r: Row) => String(r.name ?? r.title ?? r.code ?? r.slug ?? r.id);

/** Public URL of one of our buckets -> object path, else null (external URLs are left alone). */
export function bucketPath(url: unknown, bucket: string): string | null {
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/`;
  return typeof url === "string" && url.startsWith(prefix) ? decodeURIComponent(url.slice(prefix.length).split("?")[0]) || null : null;
}
export const urlFiles = (bucket: string) => async (rows: Row[]): Promise<Files[]> =>
  [{ bucket, paths: rows.flatMap((r) => [bucketPath(r.image_url, bucket), bucketPath(r.banner_url, bucket)]).filter((p): p is string => !!p) }];

/** Best effort: the rows are already gone, so an orphaned file is logged, not rolled back. */
export async function removeFiles(entity: string, files: Files[]) {
  for (const f of files.filter((x) => x.paths.length)) {
    const { error } = await db().storage.from(f.bucket).remove(f.paths);
    if (error) log.error(`${entity}.files_delete_failed`, error, { bucket: f.bucket, count: f.paths.length });
  }
}

/** Children of deleted categories -> nearest surviving ancestor (null = becomes a root). */
export function reparent(parents: Map<string, string | null>, gone: Set<string>): Map<string, string | null> {
  const up = (id: string | null, depth = 0): string | null => (id && gone.has(id) && depth < 100 ? up(parents.get(id) ?? null, depth + 1) : id);
  const out = new Map<string, string | null>();
  for (const [id, p] of parents) if (!gone.has(id) && p && gone.has(p)) out.set(id, up(p));
  return out;
}

async function reparentCategories(ids: string[]) {
  // ponytail: one unpaged read (PostgREST caps at 1000 rows); page it if the tree ever grows past that.
  const rows = must(await from("categories").select("id, parent_id")) as { id: string; parent_id: string | null }[];
  const moves = reparent(new Map(rows.map((r) => [r.id, r.parent_id])), new Set(ids));
  // ponytail: parent_id is ON DELETE RESTRICT, so the deleted rows are detached first.
  exec(await from("categories").update({ parent_id: null }).in("id", ids));
  const byParent = new Map<string | null, string[]>();
  for (const [child, parent] of moves) byParent.set(parent, [...(byParent.get(parent) ?? []), child]);
  for (const [parent, children] of byParent) exec(await from("categories").update({ parent_id: parent }).in("id", children));
}

const inDiscounts = (rows: Row[], what: string) => {
  const used = rows.filter((r) => count(r.discount_targets) > 0);
  return used.length ? new ApiError(409, "in_discount_rules", `Remove these ${what} from coupon and offer rules first: ${used.map(label).join(", ")}`,
    { ids: used.map((r) => r.id) }) : null;
};

const crud = (name: ResourceName, entity: string, extra: Partial<RemoveSpec> = {}): RemoveSpec => ({
  entity, table: RESOURCES[name].table, perm: RESOURCES[name].write, tags: RESOURCES[name].tags, select: "*", ...extra,
});

export const REMOVABLE = {
  products: {
    entity: "product", table: "products", perm: "catalog.write", tags: ["catalog", "home"],
    select: "id, slug, name, status, order_items!order_items_product_id_fkey(count), discount_targets!discount_targets_product_id_fkey(count), "
      + "product_variants!product_variants_product_id_fkey(discount_targets!discount_targets_variant_id_fkey(count))",
    // order_items.product_id is ON DELETE SET NULL: a hard delete would orphan order history, and a delete that drops
    // the only include-target of a coupon would make it apply store-wide. Those products are archived instead.
    keep: (r) => count(r.order_items) > 0 || count(r.discount_targets) > 0
      || (Array.isArray(r.product_variants) && (r.product_variants as Row[]).some((v) => count(v.discount_targets) > 0)),
    soft: { status: "archived" }, softPerm: "catalog.publish",
    files: async (rows) => {
      const ids = rows.map((r) => r.id);
      const [media, photos] = await Promise.all([
        from("product_media").select("storage_path").in("product_id", ids),
        from("review_media").select("storage_path, reviews!inner(product_id)").in("reviews.product_id", ids),
      ]);
      const paths = (res: typeof media) => (must(res) as Row[]).flatMap((m) => (typeof m.storage_path === "string" ? [m.storage_path] : []));
      return [{ bucket: "product-media", paths: paths(media) }, { bucket: "review-media", paths: paths(photos) }];
    },
  },
  categories: {
    entity: "category", table: "categories", perm: "catalog.write", tags: ["catalog", "home"],
    select: "id, slug, name, parent_id, image_url, banner_url, products!products_category_id_fkey(count), discount_targets!discount_targets_category_id_fkey(count)",
    block: (rows) => {
      const busy = rows.filter((r) => count(r.products) > 0);
      if (busy.length) {
        return new ApiError(409, "category_in_use", `Move the products out of these categories first: ${busy.map((r) => `${label(r)} (${count(r.products)})`).join(", ")}`,
          { categories: busy.map((r) => ({ id: r.id, slug: r.slug, productCount: count(r.products) })) });
      }
      return inDiscounts(rows, "categories");
    },
    before: reparentCategories,
    files: urlFiles("category-media"),
  },
  collections: {
    entity: "collection", table: "collections", perm: "catalog.write", tags: ["catalog", "home"],
    // collection_products / campaign_collections rows cascade; the products themselves stay.
    select: "id, slug, name, image_url, banner_url, discount_targets!discount_targets_collection_id_fkey(count)",
    block: (rows) => inDiscounts(rows, "collections"),
    files: urlFiles("collection-media"),
  },
  coupons: {
    entity: "coupon", table: "coupons", perm: "coupons.write", tags: ["home"],
    // coupon_redemptions is ON DELETE RESTRICT and orders.coupon_id would be nulled: used coupons are archived.
    select: "id, code, status, coupon_redemptions!coupon_redemptions_coupon_id_fkey(count), orders!orders_coupon_fk(count)",
    keep: (r) => count(r.coupon_redemptions) > 0 || count(r.orders) > 0, soft: { status: "archived" },
  },
  offers: {
    entity: "offer", table: "offers", perm: "offers.write", tags: ["catalog", "home"],
    select: "id, name, slug, status, offer_redemptions!offer_redemptions_offer_id_fkey(count)",
    keep: (r) => count(r.offer_redemptions) > 0, soft: { status: "archived" },
  },
  blog: { entity: "blog_post", table: "blog_posts", perm: "blog.write", tags: ["content", "home"], select: "id, slug, title, status" },
  faqs: crud("faqs", "faq"),
  testimonials: crud("testimonials", "testimonial"),
  pages: crud("pages", "content_page"),
  "home-sections": crud("home-sections", "home_section", { media: (r) => r.config }),
  "seo-overrides": crud("seo-overrides", "seo_override"),
  redirects: crud("redirects", "redirect"),
  campaigns: crud("campaigns", "campaign"),
  "shipping-methods": crud("shipping-methods", "shipping_method", {
    // orders.shipping_method_id is ON DELETE SET NULL: methods used by orders are switched off instead.
    select: "id, code, name, is_active, orders!orders_shipping_method_id_fkey(count)", keep: (r) => count(r.orders) > 0, soft: { is_active: false },
  }),
  "shipping-zones": crud("shipping-zones", "shipping_zone", {
    select: "id, name, is_default, is_active, shipping_methods!shipping_methods_zone_id_fkey(orders!orders_shipping_method_id_fkey(count))",
    keep: (r) => Array.isArray(r.shipping_methods) && (r.shipping_methods as Row[]).some((m) => count(m.orders) > 0),
    soft: { is_active: false },
    block: (rows) => {
      const d = rows.find((r) => r.is_default);
      return d ? new ApiError(409, "default_zone", `Make another zone the default before deleting ${label(d)}`) : null;
    },
  }),
} satisfies Record<string, RemoveSpec>;
export type Removable = keyof typeof REMOVABLE;
export const isRemovable = (name: string): name is Removable => Object.hasOwn(REMOVABLE, name);

/**
 * Bulk delete (1-200 ids): rows referenced by order history are soft-deleted, the rest hard-deleted, owned storage
 * objects removed. ponytail: not one transaction; each step is idempotent, so a retry finishes a partial run.
 */
export async function removeMany(actor: Actor, name: Removable, ids: string[]) {
  const s: RemoveSpec = REMOVABLE[name];
  assertCan(actor, s.perm);
  const rows = must(await from(s.table).select(s.select).in("id", ids)) as unknown as Row[];
  if (!rows.length) notFound(s.entity.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()));
  const blocked = s.block?.(rows);
  if (blocked) throw blocked;
  const kept = rows.filter((r) => s.keep?.(r)).map((r) => String(r.id));
  const gone = rows.filter((r) => !s.keep?.(r));
  const goneIds = gone.map((r) => String(r.id));
  if (kept.length && s.softPerm) assertCan(actor, s.softPerm);
  const files = gone.length && s.files ? await s.files(gone) : [];
  if (goneIds.length) {
    await s.before?.(goneIds);
    exec(await from(s.table).delete().in("id", goneIds));
  }
  if (kept.length) exec(await from(s.table).update(s.soft ?? {}).in("id", kept));
  await removeFiles(s.entity, files);
  if (s.media && gone.length) await pruneContentMedia(s.entity, gone.flatMap((r) => [...mediaPaths(s.media!(r))]));
  await audit(actor, `${s.entity}.delete`, s.table, rows.length === 1 ? String(rows[0].id) : null,
    rows.length === 1 ? rows[0] : { rows }, { deleted: goneIds, archived: kept, soft: kept.length ? s.soft : undefined });
  revalidate(...s.tags);
  log.info(`${s.entity}.deleted`, { count: goneIds.length, archived: kept.length, actor: actor.userId });
  return { deleted: goneIds.length, archived: kept.length };
}

/** `DELETE /api/admin/<resource>` with `{ids}` -> `{deleted, archived}`. */
export const bulkDeleteRoute = (svc: string, name: Removable) => route(svc, async ({ req }) => {
  const actor = await guard(REMOVABLE[name].perm);
  return ok(await removeMany(actor, name, (await parse(req, BulkDeleteSchema)).ids));
});
