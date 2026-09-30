import "server-only";
import { hasSupabase } from "@/lib/env";
import { products } from "@/data/products";
import { categories } from "@/data/categories";
import { collections } from "@/data/collections";
import { reviews } from "@/data/reviews";
import { newIn, priceBands, sortOptions } from "@/data/content";
import type { Category, Collection, Media, Product, Review } from "@/types/domain";

export type SortId = (typeof sortOptions)[number]["id"];

/** Scope (which products a page is about) + shopper refinements, all optional. */
export interface ProductFilters {
  departmentId?: string;   // top-level category id (cat_clothing / cat_sneakers)
  collectionId?: string;
  categories?: string[];   // sub-category slugs (for sneakers these are silhouettes)
  sizes?: string[];
  colors?: string[];
  materials?: string[];
  price?: string;          // priceBands id
  inStock?: boolean;
  sort?: SortId;
  q?: string;
}

export interface Facets {
  categories: { slug: string; name: string; count: number }[];
  sizes: string[];
  colors: { name: string; hex?: string }[];
  materials: string[];
  priceBands: { id: string; label: string }[];
}

export interface CollectionPage {
  slug: string; title: string; description?: string; image?: Media;
  kind: "department" | "collection" | "new";
  isFootwear: boolean;
  scope: ProductFilters;
  seo?: Collection["seo"];
}

const childrenOf = (parentId: string) => categories.filter((c) => c.parentId === parentId);
const categoryById = (id: string) => categories.find((c) => c.id === id);
const departmentOf = (p: Product) => categoryById(p.categoryId)?.parentId ?? p.categoryId;
const num = (id: string) => Number(id.replace(/\D/g, ""));

function matches(p: Product, f: ProductFilters): boolean {
  if (p.status !== "published") return false;
  if (f.departmentId && departmentOf(p) !== f.departmentId) return false;
  if (f.collectionId && !p.collectionIds.includes(f.collectionId)) return false;
  if (f.categories?.length && !f.categories.includes(categoryById(p.categoryId)?.slug ?? "")) return false;
  if (f.materials?.length && !f.materials.includes(p.material ?? "")) return false;
  if (f.price) {
    const band = priceBands.find((b) => b.id === f.price);
    if (band && (p.priceFrom < band.min || p.priceFrom >= band.max)) return false;
  }
  if (f.q) {
    const hay = [p.name, p.descriptor, p.material, categoryById(p.categoryId)?.name, categoryById(departmentOf(p))?.name, ...p.variants.map((v) => v.color)]
      .join(" ").toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t.replace(/s$/, "")))) return false;
  }
  // Variant-level filters must be satisfied by the same variant (e.g. Black *in* M).
  if (f.sizes?.length || f.colors?.length || f.inStock) {
    return p.variants.some((v) =>
      (!f.sizes?.length || f.sizes.includes(v.size)) &&
      (!f.colors?.length || f.colors.includes(v.color)) &&
      ((!f.sizes?.length && !f.inStock) || v.stock > 0),
    );
  }
  return true;
}

const sorters: Record<SortId, (a: Product, b: Product) => number> = {
  featured: () => 0,
  newest: (a, b) => num(b.id) - num(a.id),
  "price-asc": (a, b) => a.priceFrom - b.priceFrom,
  "price-desc": (a, b) => b.priceFrom - a.priceFrom,
  rating: (a, b) => b.rating - a.rating,
};

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  return products.filter((p) => matches(p, filters)).sort(sorters[filters.sort ?? "featured"]);
}

export async function searchProducts(q: string, filters: ProductFilters = {}): Promise<Product[]> {
  if (hasSupabase) { /* TODO(backend agent): query supabase (full-text) */ }
  return q.trim() ? getProducts({ ...filters, q: q.trim() }) : [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  return products.find((p) => p.slug === slug && p.status === "published") ?? null;
}

export async function getProductsByIds(ids: readonly string[]): Promise<Product[]> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  return ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);
}

/** Same department first, sharing a collection ranks higher. */
export async function getRecommendations(product: Product, limit = 4): Promise<Product[]> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  const score = (p: Product) =>
    p.collectionIds.filter((c) => product.collectionIds.includes(c)).length + (departmentOf(p) === departmentOf(product) ? 0 : 2);
  return products.filter((p) => p.id !== product.id).sort((a, b) => score(b) - score(a)).slice(0, limit);
}

export async function getCategories(): Promise<Category[]> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  return categories;
}

export async function getCollections(): Promise<Collection[]> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  return collections;
}

/** Resolves a /collections/[slug] URL: a department (clothing, sneakers) or a merchandised collection. */
export async function getCollection(slug: string): Promise<CollectionPage | null> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  const dept = categories.find((c) => c.slug === slug && c.parentId === null);
  if (dept) {
    return {
      slug, title: dept.name, description: dept.description, image: dept.image, kind: "department",
      isFootwear: dept.id === "cat_sneakers", scope: { departmentId: dept.id }, seo: dept.seo,
    };
  }
  const col = collections.find((c) => c.slug === slug);
  if (!col) return null;
  const scoped = products.filter((p) => p.collectionIds.includes(col.id));
  return {
    slug, title: col.name, description: col.description, image: col.image, kind: "collection",
    isFootwear: scoped.length > 0 && scoped.every((p) => departmentOf(p) === "cat_sneakers"),
    scope: { collectionId: col.id }, seo: col.seo,
  };
}

export async function getNewIn(): Promise<CollectionPage> {
  return { slug: "new-in", title: newIn.title, description: newIn.description, kind: "new", isFootwear: false, scope: { sort: "newest" } };
}

export function getFacets(list: Product[], departmentId?: string): Facets {
  const subcats = departmentId ? childrenOf(departmentId) : categories.filter((c) => c.parentId);
  const sizes = [...new Set(list.flatMap((p) => p.variants.map((v) => v.size)))];
  const colorMap = new Map(list.flatMap((p) => p.variants.map((v) => [v.color, v.colorHex] as const)));
  return {
    categories: subcats
      .map((c) => ({ slug: c.slug, name: c.name, count: list.filter((p) => p.categoryId === c.id).length }))
      .filter((c) => c.count > 0),
    sizes,
    colors: [...colorMap].map(([name, hex]) => ({ name, hex })),
    materials: [...new Set(list.map((p) => p.material).filter((m): m is string => !!m))].sort(),
    priceBands: priceBands.map(({ id, label }) => ({ id, label })),
  };
}

export async function getReviews(productId: string): Promise<Review[]> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  return reviews.filter((r) => r.productId === productId && r.status === "approved");
}
