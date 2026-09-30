import "server-only";
import type { z } from "zod";
import { ApiError } from "@/backend/_core/http";
import type { AdminCategory } from "@/types/admin";
import type { TablesInsert, TablesUpdate } from "@/types/database";
import { type Actor, audit, camel, db, exec, fetchAll, maybe, must, notFound, read, revalidate, snake } from "./_shared";
import { slugTaken } from "./products";
import type { CategoryPatchSchema, CategoryReorderSchema, CategorySchema } from "./schemas/catalog";
import { createsCycle } from "./schemas/rules";

async function allCategories() {
  const c = db();
  const [cats, products] = await Promise.all([
    fetchAll((f, t) => c.from("categories").select("*").order("sort_order").order("name").range(f, t)),
    fetchAll((f, t) => c.from("products").select("category_id").order("id").range(f, t)),
  ]);
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  return cats.map((x): AdminCategory => ({ ...camel(x), productCount: counts.get(x.id) ?? 0, children: [] }));
}

/** Tree (roots with nested children), productCount = products assigned directly. */
export const listCategoryTree = () => read("catalog.read", [] as AdminCategory[], async () => {
  const flat = await allCategories();
  const byId = new Map(flat.map((x) => [x.id, x]));
  const roots: AdminCategory[] = [];
  for (const x of flat) ((x.parentId ? byId.get(x.parentId)?.children : undefined) ?? roots).push(x);
  return roots;
});

/** Flat list for pickers (depth-first order, `depth` for indentation). */
export const listCategoryOptions = () => read("catalog.read", [] as { id: string; name: string; slug: string; depth: number }[], async () => {
  const tree = await listCategoryTree();
  const out: { id: string; name: string; slug: string; depth: number }[] = [];
  const walk = (nodes: AdminCategory[], depth: number) => nodes.forEach((n) => { out.push({ id: n.id, name: n.name, slug: n.slug, depth }); walk(n.children, depth + 1); });
  walk(tree, 0);
  return out;
});

export const getCategory = (slug: string) => read("catalog.read", null, async () =>
  (await allCategories()).find((x) => x.slug === slug) ?? null);

async function parentMap() {
  return new Map(must(await db().from("categories").select("id, parent_id")).map((r) => [r.id, r.parent_id]));
}

async function assertSlugFree(slug: string, excludeId?: string) {
  const taken = await slugTaken("category", slug, excludeId);
  if (taken) throw new ApiError(409, "slug_taken", `Slug "${slug}" is already used by a ${taken === "categories" ? "category" : "collection"}`);
}

export async function createCategory(actor: Actor, input: z.infer<typeof CategorySchema>) {
  await assertSlugFree(input.slug);
  const row = must(await db().from("categories").insert(snake<TablesInsert<"categories">>(input)).select("*").single());
  await audit(actor, "category.create", "categories", row.id, null, row);
  revalidate("catalog", "home");
  return camel(row);
}

export async function updateCategory(actor: Actor, slug: string, input: z.infer<typeof CategoryPatchSchema>) {
  const c = db();
  const before = maybe(await c.from("categories").select("*").eq("slug", slug).maybeSingle());
  if (!before) notFound("Category");
  if (input.slug && input.slug !== before.slug) await assertSlugFree(input.slug, before.id);
  if (input.parentId !== undefined && createsCycle(await parentMap(), before.id, input.parentId)) {
    throw new ApiError(422, "category_cycle", "A category cannot be moved under itself or its descendants");
  }
  const row = must(await c.from("categories").update(snake<TablesUpdate<"categories">>(input)).eq("id", before.id).select("*").single());
  await audit(actor, "category.update", "categories", row.id, before, row);
  revalidate("catalog", "home");
  return camel(row);
}

export async function reorderCategories(actor: Actor, { items }: z.infer<typeof CategoryReorderSchema>) {
  const parents = await parentMap();
  for (const i of items) parents.set(i.id, i.parentId);   // validate the final tree, not each step
  for (const i of items) {
    if (!parents.has(i.id)) notFound(`Category ${i.id}`);
    if (createsCycle(parents, i.id, i.parentId)) throw new ApiError(422, "category_cycle", "Reorder would create a loop");
  }
  for (const i of items) exec(await db().from("categories").update({ parent_id: i.parentId, sort_order: i.sortOrder }).eq("id", i.id));
  await audit(actor, "category.reorder", "categories", null, null, { items });
  revalidate("catalog", "home");
  return { updated: items.length };
}

/**
 * Blocked while products are assigned (409 with counts) unless `reassignTo` (a category slug) is given:
 * products move there; child categories move up to the deleted category's parent.
 */
export async function deleteCategory(actor: Actor, slug: string, reassignTo?: string) {
  const c = db();
  const cat = maybe(await c.from("categories").select("*").eq("slug", slug).maybeSingle());
  if (!cat) notFound("Category");
  const [{ count: productCount }, { count: childCount }] = await Promise.all([
    c.from("products").select("id", { count: "exact", head: true }).eq("category_id", cat.id),
    c.from("categories").select("id", { count: "exact", head: true }).eq("parent_id", cat.id),
  ]);
  if ((productCount ?? 0) > 0 && !reassignTo) {
    throw new ApiError(409, "category_in_use", `${productCount} product(s) are assigned; pass reassignTo`, { productCount, childCount });
  }
  if (reassignTo) {
    const target = maybe(await c.from("categories").select("id").eq("slug", reassignTo).maybeSingle());
    if (!target || target.id === cat.id) throw new ApiError(422, "invalid_reassign", "Reassign target must be another category");
    exec(await c.from("products").update({ category_id: target.id }).eq("category_id", cat.id));
  }
  exec(await c.from("categories").update({ parent_id: cat.parent_id }).eq("parent_id", cat.id));
  exec(await c.from("categories").delete().eq("id", cat.id));
  await audit(actor, "category.delete", "categories", cat.id, cat, { reassignTo: reassignTo ?? null, productCount, childCount });
  revalidate("catalog", "home");
  return { id: cat.id, movedProducts: productCount ?? 0, movedChildren: childCount ?? 0 };
}
