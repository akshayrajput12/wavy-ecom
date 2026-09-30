import "server-only";
import { cached, TAGS } from "@/backend/_core/cache";
import { publicDb, safe } from "@/backend/_core/db";
import type { Category, CategoryRef, Collection, Media, Paginated, Product } from "@/types/domain";
import { computeFacets, EMPTY_FACETS, type FacetRow, type Facets } from "./facets";
import {
  ancestors, buildTree, CATEGORY_COLS, COLLECTION_COLS, descendantIds, PRODUCT_CARD_SELECT, PRODUCT_DETAIL_SELECT,
  toCategory, toCollection, toMedia, toProduct, type CategoryRow, type CollectionRow, type ProductRow,
} from "./mapper";
import { searchTerm, type ProductQuery } from "./schema";

export type ProductList = Paginated<Product> & { facets: Facets };
export type CategoryWithPath = Category & { ancestors: CategoryRef[] };
export type CatalogPage =
  | { kind: "category"; category: CategoryWithPath }
  | { kind: "collection"; collection: Collection }
  | { kind: "redirect"; to: string };
export interface SearchSuggestions {
  products: { id: string; slug: string; name: string; brand?: string; priceFrom: number; image?: Media }[];
  categories: CategoryRef[];
  collections: { id: string; name: string; slug: string }[];
}

// ---------- Categories / collections ----------
/** Every active category, flat, sorted. */
export const listCategoriesFlat = cached("catalog.categories", [TAGS.catalog], async (): Promise<Category[]> => {
  const db = publicDb();
  if (!db) return [];
  const rows: CategoryRow[] = safe(await db.from("categories").select(CATEGORY_COLS).order("sort_order"), "list categories", []);
  return rows.map(toCategory);
});

/** Category tree (roots with nested `children`). */
export async function listCategories(): Promise<Category[]> {
  return buildTree(await listCategoriesFlat());
}

export async function getCategoryBySlug(slug: string): Promise<CategoryWithPath | null> {
  const flat = await listCategoriesFlat();
  const hit = flat.find((c) => c.slug === slug);
  if (!hit) return null;
  const node = findInTree(buildTree(flat), hit.id)!;
  return { ...node, ancestors: ancestors(flat, hit.id).map(({ id, name, slug: s }) => ({ id, name, slug: s })) };
}

function findInTree(nodes: Category[], id: string): Category | undefined {
  for (const n of nodes) { if (n.id === id) return n; const c = findInTree(n.children ?? [], id); if (c) return c; }
}

/** Active collections inside their visibility window, with published product counts. */
export const listCollections = cached("catalog.collections", [TAGS.catalog], async (): Promise<Collection[]> => {
  const db = publicDb();
  if (!db) return [];
  const rows: CollectionRow[] = safe(
    await db.from("collections").select(`${COLLECTION_COLS}, product_count:collection_products(count)`).order("sort_order"),
    "list collections", [],
  );
  return rows.map(toCollection);
});

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  return (await listCollections()).find((c) => c.slug === slug) ?? null;
}

/** Active 301 target for an old path (e.g. "/products/old-slug"), or null. */
export const getRedirect = cached("catalog.redirect", [TAGS.catalog], async (fromPath: string): Promise<string | null> => {
  const db = publicDb();
  if (!db) return null;
  const row: { to_path: string } | null = safe(
    await db.from("redirects").select("to_path").eq("from_path", fromPath).maybeSingle(), "lookup redirect", null,
  );
  return row?.to_path ?? null;
});

/** /collections/[slug]: categories and collections share the slug space (catalog_slug_guard). */
export async function resolveCollectionOrCategory(slug: string): Promise<CatalogPage | null> {
  const category = await getCategoryBySlug(slug);
  if (category) return { kind: "category", category };
  const collection = await getCollectionBySlug(slug);
  if (collection) return { kind: "collection", collection };
  const to = await getRedirect(`/collections/${slug}`);
  return to ? { kind: "redirect", to } : null;
}

// ---------- Products ----------
export const getProductBySlug = cached("catalog.product", [TAGS.catalog], async (slug: string): Promise<Product | null> => {
  const db = publicDb();
  if (!db) return null;
  const row: ProductRow | null = safe(
    await db.from("products").select(PRODUCT_DETAIL_SELECT).eq("slug", slug).eq("status", "published").maybeSingle(),
    "get product", null,
  );
  return row ? toProduct(row) : null;
});

/** Published products in the order of `ids` (unknown/unpublished ids are skipped). */
export const getProductsByIds = cached("catalog.byIds", [TAGS.catalog], async (ids: string[]): Promise<Product[]> => {
  const db = publicDb();
  if (!db || !ids.length) return [];
  const rows: ProductRow[] = safe(
    await db.from("products").select(PRODUCT_CARD_SELECT).in("id", ids.slice(0, 100)).eq("status", "published"),
    "get products by ids", [],
  );
  const byId = new Map(rows.map((r) => [r.id, toProduct(r)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
});

const relatedIds = cached("catalog.related", [TAGS.catalog], async (productId: string, categoryId: string, limit: number) => {
  const db = publicDb();
  if (!db) return [];
  const explicit: { related_product_id: string }[] = safe(
    await db.from("related_products").select("related_product_id").eq("product_id", productId).order("sort_order").limit(limit),
    "list related", [],
  );
  const ids = [...new Set(explicit.map((r) => r.related_product_id))];
  if (ids.length < limit) {
    const same: { id: string }[] = safe(
      await db.from("products").select("id").eq("status", "published").eq("category_id", categoryId).neq("id", productId)
        .order("is_featured", { ascending: false }).order("review_count_display", { ascending: false }).limit(limit),
      "list same-category", [],
    );
    for (const r of same) if (ids.length < limit && !ids.includes(r.id)) ids.push(r.id);
  }
  return ids;
});

/** Curated related products (related_products), topped up with same-category best sellers. */
export async function getRelatedProducts(product: Pick<Product, "id" | "categoryId">, limit = 8): Promise<Product[]> {
  return getProductsByIds(await relatedIds(product.id, product.categoryId, limit));
}

/** PLP/search. Scope = category (incl. descendants) / collection / q; refinements = opt, brand, price, inStock. */
export const listProducts = cached("catalog.list", [TAGS.catalog], async (q: ProductQuery, withFacets = true): Promise<ProductList> => {
  const empty: ProductList = { items: [], total: 0, page: q.page, pageSize: q.pageSize, facets: EMPTY_FACETS };
  const db = publicDb();
  if (!db) return empty;

  const flat = await listCategoriesFlat();
  let categoryIds: string[] | undefined;
  let scopeCategoryId: string | undefined;
  if (q.category) {
    const c = flat.find((x) => x.slug === q.category);
    if (!c) return empty;
    scopeCategoryId = c.id;
    categoryIds = descendantIds(flat, c.id);
  }
  let collectionId: string | undefined;
  if (q.collection) {
    const c = await getCollectionBySlug(q.collection);
    if (!c) return empty;
    collectionId = c.id;
  }
  const term = q.q ? searchTerm(q.q) : "";
  const values = q.opt.map((o) => (o.includes(":") ? o.slice(o.indexOf(":") + 1) : o).trim()).filter(Boolean);
  const variantFilter = values.length > 0 || q.inStock;

  const scoped = (select: string, refine: boolean) => {
    const joins = [collectionId && "cf:collection_products!collection_products_product_id_fkey!inner(collection_id)", refine && variantFilter && "vf:product_variants!product_variants_product_id_fkey!inner(id)"];
    const sel = [select, ...joins.filter(Boolean)].join(", ");
    let b = db.from("products").select(sel, refine ? { count: "exact" } : undefined).eq("status", "published");
    if (categoryIds) b = b.in("category_id", categoryIds);
    if (collectionId) b = b.eq("cf.collection_id", collectionId);
    if (term) {
      const quoted = `"${term}"`;
      b = b.or(`name.ilike."*${term}*",brand.ilike."*${term}*",search_vector.wfts(english).${quoted}`);
    }
    if (!refine) return b;
    if (q.brand.length) b = b.in("brand", q.brand);
    if (q.min !== undefined) b = b.gte("price_min", q.min);
    if (q.max !== undefined) b = b.lte("price_min", q.max);
    if (q.inStock) b = b.eq("vf.status", "active");
    // ponytail: option filter matches the value on any axis (Black on Color); per-axis match needs an RPC.
    if (values.length) {
      const list = values.map((v) => `"${v.replace(/"/g, "")}"`).join(",");
      b = b.or(`option1.in.(${list}),option2.in.(${list}),option3.in.(${list})`, { referencedTable: "vf" });
    }
    return b;
  };

  let main = scoped(PRODUCT_CARD_SELECT, true);
  const order = SORTS[q.sort];
  for (const [col, ascending] of order) main = main.order(col, { ascending, nullsFirst: false });
  const from = (q.page - 1) * q.pageSize;

  const [res, facetRes] = await Promise.all([
    main.range(from, from + q.pageSize - 1),
    // ponytail: facets computed in JS over up to 1000 in-scope products; move to SQL when catalogs grow.
    withFacets
      ? scoped("id, brand, category_id, price_min, option_names, fv:product_variants!product_variants_product_id_fkey(option1, option2, option3, color_hex)", false).limit(1000)
      : null,
  ]);
  const rows: ProductRow[] = safe(res, "list products", []);
  const facetRows: FacetRow[] = facetRes ? safe(facetRes, "list facets", []) : [];
  return {
    items: rows.map(toProduct), total: res.count ?? rows.length, page: q.page, pageSize: q.pageSize,
    facets: facetRes ? computeFacets(facetRows, flat, scopeCategoryId) : EMPTY_FACETS,
  };
});

const SORTS: Record<ProductQuery["sort"], [string, boolean][]> = {
  featured: [["is_featured", false], ["sort_order", true], ["published_at", false]],
  newest: [["published_at", false]],
  "price-asc": [["price_min", true]],
  "price-desc": [["price_min", false]],
  rating: [["rating_display", false], ["review_count_display", false]],
};

/** Typeahead: up to 6 products + matching categories/collections. */
export const searchSuggestions = cached("catalog.suggest", [TAGS.catalog], async (q: string): Promise<SearchSuggestions> => {
  const term = searchTerm(q);
  const empty: SearchSuggestions = { products: [], categories: [], collections: [] };
  const db = publicDb();
  if (!db || term.length < 2) return empty;
  const needle = term.toLowerCase();
  const [res, flat, cols] = await Promise.all([
    db.from("products").select("id, slug, name, brand, price_min, media:product_media!product_media_product_id_fkey(url, alt, is_primary, position)")
      .eq("status", "published").or(`name.ilike."*${term}*",brand.ilike."*${term}*"`)
      .order("review_count_display", { ascending: false }).limit(6),
    listCategoriesFlat(),
    listCollections(),
  ]);
  type Row = { id: string; slug: string; name: string; brand: string | null; price_min: number | null; media: { url: string; alt: string; is_primary: boolean; position: number }[] | null };
  const rows: Row[] = safe(res, "search suggestions", []);
  return {
    products: rows.map((r) => {
      const m = [...(r.media ?? [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position)[0];
      return { id: r.id, slug: r.slug, name: r.name, brand: r.brand ?? undefined, priceFrom: r.price_min ?? 0, image: toMedia(m?.url, m?.alt) };
    }),
    categories: flat.filter((c) => c.name.toLowerCase().includes(needle)).slice(0, 4).map(({ id, name, slug }) => ({ id, name, slug })),
    collections: cols.filter((c) => c.name.toLowerCase().includes(needle)).slice(0, 3).map(({ id, name, slug }) => ({ id, name, slug })),
  };
});
