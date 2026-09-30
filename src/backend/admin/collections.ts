import "server-only";
import type { z } from "zod";
import { ApiError } from "@/backend/_core/http";
import type { AdminCollection, AdminCollectionDetail } from "@/types/admin";
import type { TablesInsert, TablesUpdate } from "@/types/database";
import { type Actor, audit, camel, db, exec, fetchAll, maybe, must, notFound, read, revalidate, snake } from "./_shared";
import { slugTaken } from "./products";
import type { CollectionPatchSchema, CollectionSchema } from "./schemas/catalog";

export const listCollections = () => read("catalog.read", [] as AdminCollection[], async () => {
  const c = db();
  const [rows, members] = await Promise.all([
    c.from("collections").select("*").order("sort_order").order("name"),
    fetchAll((f, t) => c.from("collection_products").select("collection_id").order("collection_id").range(f, t)),
  ]);
  const counts = new Map<string, number>();
  for (const m of members) counts.set(m.collection_id, (counts.get(m.collection_id) ?? 0) + 1);
  return must(rows).map((x) => ({ ...camel(x), productCount: counts.get(x.id) ?? 0 }));
});

async function loadCollection(slug: string): Promise<AdminCollectionDetail | null> {
  const c = db();
  const col = maybe(await c.from("collections").select("*").eq("slug", slug).maybeSingle());
  if (!col) return null;
  const members = must(await c.from("collection_products").select("product_id, position").eq("collection_id", col.id).order("position"));
  const ids = members.map((m) => m.product_id);
  const [products, media] = ids.length
    ? await Promise.all([
        c.from("products").select("id, name, slug, status").in("id", ids).then(must),
        c.from("product_media").select("product_id, url").in("product_id", ids).eq("is_primary", true).then(must),
      ])
    : [[], []];
  const p = new Map(products.map((x) => [x.id, x]));
  const img = new Map(media.map((m) => [m.product_id, m.url]));
  return {
    ...camel(col), productCount: ids.length,
    products: members.flatMap((m) => {
      const x = p.get(m.product_id);
      return x ? [{ productId: x.id, name: x.name, slug: x.slug, status: x.status, image: img.get(x.id) ?? null, position: m.position }] : [];
    }),
  };
}

export const getCollection = (slug: string) => read("catalog.read", null, () => loadCollection(slug));

async function assertSlugFree(slug: string, excludeId?: string) {
  const taken = await slugTaken("collection", slug, excludeId);
  if (taken) throw new ApiError(409, "slug_taken", `Slug "${slug}" is already used by a ${taken === "categories" ? "category" : "collection"}`);
}

export async function createCollection(actor: Actor, input: z.infer<typeof CollectionSchema>) {
  await assertSlugFree(input.slug);
  const row = must(await db().from("collections").insert(snake<TablesInsert<"collections">>(input)).select("*").single());
  await audit(actor, "collection.create", "collections", row.id, null, row);
  revalidate("catalog", "home");
  return camel(row);
}

export async function updateCollection(actor: Actor, slug: string, input: z.infer<typeof CollectionPatchSchema>) {
  const c = db();
  const before = maybe(await c.from("collections").select("*").eq("slug", slug).maybeSingle());
  if (!before) notFound("Collection");
  if (input.slug && input.slug !== before.slug) await assertSlugFree(input.slug, before.id);
  const row = must(await c.from("collections").update(snake<TablesUpdate<"collections">>(input)).eq("id", before.id).select("*").single());
  await audit(actor, "collection.update", "collections", row.id, before, row);
  revalidate("catalog", "home");
  return camel(row);
}

/** Membership rows cascade in the DB; products are untouched. */
export async function deleteCollection(actor: Actor, slug: string) {
  const col = maybe(await db().from("collections").select("*").eq("slug", slug).maybeSingle());
  if (!col) notFound("Collection");
  exec(await db().from("collections").delete().eq("id", col.id));
  await audit(actor, "collection.delete", "collections", col.id, col, null);
  revalidate("catalog", "home");
  return { id: col.id };
}

/** add = append at the end, remove = drop, reorder = productIds is the full new order. */
export async function editMembership(actor: Actor, slug: string, op: "add" | "remove" | "reorder", productIds: string[]) {
  const c = db();
  const col = maybe(await c.from("collections").select("id").eq("slug", slug).maybeSingle());
  if (!col) notFound("Collection");
  const current = must(await c.from("collection_products").select("product_id, position").eq("collection_id", col.id).order("position"));
  if (op === "remove") {
    exec(await c.from("collection_products").delete().eq("collection_id", col.id).in("product_id", productIds));
  } else if (op === "add") {
    const have = new Set(current.map((m) => m.product_id));
    let next = (current.at(-1)?.position ?? -1) + 1;
    const rows = productIds.filter((id) => !have.has(id)).map((id) => ({ collection_id: col.id, product_id: id, position: next++ }));
    if (rows.length) exec(await c.from("collection_products").insert(rows));
  } else {
    const have = new Set(current.map((m) => m.product_id));
    if (productIds.length !== have.size || productIds.some((id) => !have.has(id))) {
      throw new ApiError(422, "reorder_mismatch", "Reorder must list exactly the current members");
    }
    exec(await c.from("collection_products").upsert(productIds.map((id, i) => ({ collection_id: col.id, product_id: id, position: i })),
      { onConflict: "collection_id,product_id" }));
  }
  await audit(actor, `collection.members_${op}`, "collections", col.id, { productIds: current.map((m) => m.product_id) }, { productIds });
  revalidate("catalog", "home");
  return loadCollection(slug);
}
