import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { camel, db, fetchAll, must } from "@/backend/admin/_shared";
import type { AdminProduct } from "@/types/admin";
import type { ProductSpecification } from "@/types/domain";

export type DbCategory = { id: string; name: string; slug: string; parent_id: string | null; description: string | null; show_on_home: boolean; sort_order: number };
export type DbCollection = { id: string; name: string; slug: string; description: string | null; is_active: boolean };
export type Owner = { sku: string; barcode: string | null; productId: string; productSlug: string };

/** PostgREST puts `in` lists in the URL: keep each request well under the URL limit. */
const chunks = <T>(xs: T[], n = 100) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
const inChunks = async <T>(xs: string[], q: (part: string[]) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>) =>
  (await Promise.all(chunks([...new Set(xs)]).map(async (part) => must(await q(part))))).flat();

export async function loadTaxonomy() {
  const c = db();
  const [categories, collections] = await Promise.all([
    fetchAll((f, t) => c.from("categories").select("id, name, slug, parent_id, description, show_on_home, sort_order").order("sort_order").order("name").range(f, t)),
    fetchAll((f, t) => c.from("collections").select("id, name, slug, description, is_active").order("sort_order").order("name").range(f, t)),
  ]);
  return { categories: categories as DbCategory[], collections: collections as DbCollection[] };
}

/** Full product documents (media left out: the import never touches it) by slug, in bulk. */
export async function loadProducts(slugs: string[]): Promise<Map<string, AdminProduct>> {
  const c = db();
  const rows = await inChunks(slugs, (part) => c.from("products").select("*").in("slug", part));
  if (!rows.length) return new Map();
  const ids = rows.map((p) => p.id);
  const [variants, members] = await Promise.all([
    inChunks(ids, (part) => c.from("product_variants").select("*").in("product_id", part).order("position")),
    inChunks(ids, (part) => c.from("collection_products").select("collection_id, product_id").in("product_id", part)),
  ]);
  const stock = new Map((await inChunks(variants.map((v) => v.id), (part) => c.from("inventory").select("variant_id, on_hand, reserved").in("variant_id", part)))
    .map((s) => [s.variant_id, s]));
  return new Map(rows.map((p): [string, AdminProduct] => {
    const { specifications, size_chart, ...rest } = p;   // search_vector rides along unused
    return [p.slug, {
      ...camel(rest),
      specifications: (Array.isArray(specifications) ? specifications : []) as unknown as ProductSpecification[],
      sizeChart: size_chart && typeof size_chart === "object" && !Array.isArray(size_chart) ? size_chart as Record<string, unknown> : null,
      categoryName: null, media: [],
      collectionIds: members.filter((m) => m.product_id === p.id).map((m) => m.collection_id),
      variants: variants.filter((v) => v.product_id === p.id).map(({ option1, option2, option3, ...v }) => {
        const onHand = stock.get(v.id)?.on_hand ?? 0, reserved = stock.get(v.id)?.reserved ?? 0;
        return { ...camel(v), options: [option1, option2, option3].filter((o): o is string => o != null), onHand, reserved, available: onHand - reserved };
      }),
    }];
  }));
}

/** Who owns these SKUs / barcodes today (any product). */
export async function loadOwners(skus: string[], barcodes: string[]): Promise<Owner[]> {
  const c = db();
  const cols = "sku, barcode, product_id";
  const [bySku, byBarcode] = await Promise.all([
    inChunks(skus, (part) => c.from("product_variants").select(cols).in("sku", part)),
    inChunks(barcodes, (part) => c.from("product_variants").select(cols).in("barcode", part)),
  ]);
  const found = [...bySku, ...byBarcode];
  const slugs = new Map((await inChunks(found.map((v) => v.product_id), (part) => c.from("products").select("id, slug").in("id", part))).map((p) => [p.id, p.slug]));
  return found.map((v) => ({ sku: v.sku, barcode: v.barcode, productId: v.product_id, productSlug: slugs.get(v.product_id) ?? "" }));
}

/** Existing memberships of these collections, as "collectionId:productId". */
export async function loadMemberships(collectionIds: string[]): Promise<Set<string>> {
  const rows = await inChunks(collectionIds, (part) =>
    db().from("collection_products").select("collection_id, product_id").in("collection_id", part));
  return new Set(rows.map((m) => `${m.collection_id}:${m.product_id}`));
}
