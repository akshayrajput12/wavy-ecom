import "server-only";
import type { AdminProduct, AdminProductRow, Paginated } from "@/types/admin";
import type { ProductSpecification } from "@/types/domain";
import { camel, db, fetchAll, maybe, must, pageRange, read, searchTerm } from "./_shared";
import { scanInventory } from "./inventory";
import type { ProductListQuery } from "./schemas/catalog";

type StockSummary = { available: number; variantCount: number; low: boolean; out: boolean };

async function stockByProduct(): Promise<Map<string, StockSummary>> {
  const out = new Map<string, StockSummary>();
  for (const r of await scanInventory()) {
    const s = out.get(r.productId) ?? { available: 0, variantCount: 0, low: false, out: true };
    s.variantCount++;
    if (r.status !== "disabled") {
      s.available += Math.max(0, r.available);
      if (r.available > 0) s.out = false;
      if (r.low) s.low = true;
    }
    out.set(r.productId, s);
  }
  return out;
}

/**
 * Admin product list. ponytail: ids are filtered in SQL, stock/collection filters in memory, then one page
 * of rows is fetched; fine to tens of thousands of products, replace with a SQL view past that.
 */
export const listProducts = (q: ProductListQuery) =>
  read("catalog.read", { items: [], total: 0, page: q.page, pageSize: q.pageSize } as Paginated<AdminProductRow>, async () => {
    const c = db();
    const term = searchTerm(q.q);
    const categoryIds = q.categoryId ? must(await c.rpc("category_descendants", { p_category_id: q.categoryId })) : null;
    const skuHits = term
      ? must(await c.from("product_variants").select("product_id").ilike("sku", `%${term}%`).limit(50)).map((r) => r.product_id)
      : [];
    const ids = await fetchAll((f, t) => {
      let b = c.from("products").select("id").order("updated_at", { ascending: false }).order("id");
      if (q.status) b = b.eq("status", q.status);
      if (categoryIds) b = b.in("category_id", categoryIds);
      if (term) {
        const like = `"%${term}%"`;
        b = b.or([`name.ilike.${like}`, `slug.ilike.${like}`, `brand.ilike.${like}`, ...(skuHits.length ? [`id.in.(${skuHits.join(",")})`] : [])].join(","));
      }
      return b.range(f, t);
    });
    let keep = ids.map((r) => r.id);
    if (q.collectionId) {
      const members = new Set(must(await c.from("collection_products").select("product_id").eq("collection_id", q.collectionId)).map((r) => r.product_id));
      keep = keep.filter((id) => members.has(id));
    }
    const stock = await stockByProduct();
    if (q.stock) {
      keep = keep.filter((id) => {
        const s = stock.get(id);
        return q.stock === "out" ? !s || s.out : q.stock === "low" ? !!s && !s.out && s.low : !!s && !s.out;
      });
    }
    const [from] = pageRange(q.page, q.pageSize);
    const pageIds = keep.slice(from, from + q.pageSize);
    if (!pageIds.length) return { items: [], total: keep.length, page: q.page, pageSize: q.pageSize };

    const [rows, media] = await Promise.all([
      c.from("products").select("id, slug, name, brand, status, category_id, price_min, price_max, is_featured, updated_at").in("id", pageIds),
      c.from("product_media").select("product_id, url").in("product_id", pageIds).eq("is_primary", true),
    ]);
    const products = must(rows);
    const cats = must(await c.from("categories").select("id, name").in("id", [...new Set(products.map((p) => p.category_id))]));
    const catName = new Map(cats.map((x) => [x.id, x.name]));
    const image = new Map(must(media).map((m) => [m.product_id, m.url]));
    const byId = new Map(products.map((p) => [p.id, p]));
    const items = pageIds.flatMap((id): AdminProductRow[] => {
      const p = byId.get(id);
      if (!p) return [];
      const s = stock.get(id) ?? { available: 0, variantCount: 0, low: false, out: true };
      return [{
        id, slug: p.slug, name: p.name, brand: p.brand, status: p.status, categoryId: p.category_id,
        categoryName: catName.get(p.category_id) ?? null, image: image.get(id) ?? null, priceMin: p.price_min,
        priceMax: p.price_max, variantCount: s.variantCount, available: s.available, lowStock: s.low, outOfStock: s.out,
        isFeatured: p.is_featured, updatedAt: p.updated_at,
      }];
    });
    return { items, total: keep.length, page: q.page, pageSize: q.pageSize };
  });

/** Unguarded loader shared by the getter and the write paths (callers guard). */
export async function loadProduct(slug: string): Promise<AdminProduct | null> {
  const c = db();
  const p = maybe(await c.from("products").select("*").eq("slug", slug).maybeSingle());
  if (!p) return null;
  const [variants, media, members, category] = await Promise.all([
    c.from("product_variants").select("*").eq("product_id", p.id).order("position"),
    c.from("product_media").select("*").eq("product_id", p.id).order("position"),
    c.from("collection_products").select("collection_id").eq("product_id", p.id),
    c.from("categories").select("name").eq("id", p.category_id).maybeSingle(),
  ]);
  const vs = must(variants);
  const stock = vs.length ? must(await c.from("inventory").select("variant_id, on_hand, reserved").in("variant_id", vs.map((v) => v.id))) : [];
  const inv = new Map(stock.map((s) => [s.variant_id, s]));
  const { search_vector: _sv, specifications, size_chart, ...rest } = p;
  return {
    ...camel(rest),
    specifications: (Array.isArray(specifications) ? specifications : []) as unknown as ProductSpecification[],
    sizeChart: size_chart && typeof size_chart === "object" && !Array.isArray(size_chart) ? size_chart as Record<string, unknown> : null,
    categoryName: maybe(category)?.name ?? null,
    collectionIds: must(members).map((m) => m.collection_id),
    media: must(media).map(camel),
    variants: vs.map(({ option1, option2, option3, ...v }) => {
      const onHand = inv.get(v.id)?.on_hand ?? 0, reserved = inv.get(v.id)?.reserved ?? 0;
      return { ...camel(v), options: [option1, option2, option3].filter((o): o is string => o != null), onHand, reserved, available: onHand - reserved };
    }),
  };
}

export const getProduct = (slug: string) => read("catalog.read", null, () => loadProduct(slug));

/** Lightweight picker list (reviews composer, collection membership, home section product pickers). */
export const listProductOptions = () =>
  read("catalog.read", [] as { id: string; name: string; slug: string; status: string }[], async () =>
    fetchAll((f, t) => db().from("products").select("id, name, slug, status").order("name").range(f, t)));

/** Categories and collections share /collections/<slug>; products live at /products/<slug>. */
export async function slugTaken(entity: "product" | "category" | "collection", slug: string, excludeId?: string) {
  const c = db();
  const tables = entity === "product" ? (["products"] as const) : (["categories", "collections"] as const);
  for (const table of tables) {
    const rows = must(await c.from(table).select("id").eq("slug", slug).limit(1));
    if (rows.length && rows[0].id !== excludeId) return table;
  }
  return null;
}
