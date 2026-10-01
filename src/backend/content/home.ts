import "server-only";
import { cached, TAGS } from "@/backend/_core/cache";
import { publicDb, safe } from "@/backend/_core/db";
import { getProductsByIds, listCategoriesFlat, listCollections, listProducts } from "@/backend/catalog/repo";
import { ProductQuerySchema, type ProductSort } from "@/backend/catalog/schema";
import { logger } from "@/lib/logger";
import type { HomeSection, HomeSectionType, Product } from "@/types/domain";
import { listBlogPosts, listTestimonials } from "./repo";
import { HomeSectionConfig, type HomeSectionConfigs } from "./schema";

interface Row { id: string; type: HomeSectionType; title: string | null; subtitle: string | null; config: unknown; sort_order: number }
type Parsed = { [K in HomeSectionType]: { row: Row; type: K; config: HomeSectionConfigs[K] } }[HomeSectionType];

const log = logger.child({ svc: "content.home" });
const SOURCE_SORT: Record<string, ProductSort> = { featured: "featured", new: "newest", best_rated: "rating", collection: "featured", category: "featured" };

/**
 * Active home sections in sort order, each with its referenced products/categories/collections/testimonials/posts
 * resolved. Invalid configs and sections that resolve to nothing are skipped (logged), never thrown.
 */
export const getHomeSections = cached("home.sections", [TAGS.home, TAGS.catalog, TAGS.content, TAGS.blog], async (): Promise<HomeSection[]> => {
  const db = publicDb();
  if (!db) return [];
  const rows: Row[] = safe(
    await db.from("home_sections").select("id, type, title, subtitle, config, sort_order").order("sort_order"), "list home sections", [],
  );
  const parsed = rows.flatMap((row): Parsed[] => {
    const res = HomeSectionConfig[row.type]?.safeParse(row.config);
    if (!res?.success) { log.warn("home.section_invalid", { id: row.id, type: row.type, issues: res?.error.issues }); return []; }
    return [{ row, type: row.type, config: res.data } as Parsed];
  });

  // Batch every explicitly referenced product id into one query.
  const ids = new Set<string>();
  for (const p of parsed) {
    if (p.type === "floating_showcase") p.config.productIds.forEach((id) => ids.add(id));
    if (p.type === "product_carousel" && p.config.source === "manual") p.config.productIds?.forEach((id) => ids.add(id));
  }
  const [byIds, flat, collections] = await Promise.all([getProductsByIds([...ids]), listCategoriesFlat(), listCollections()]);
  const productMap = new Map(byIds.map((p) => [p.id, p]));
  const pick = (list: string[] = [], limit?: number) => list.flatMap((id) => productMap.get(id) ?? []).slice(0, limit ?? 24);

  const carousel = async (c: HomeSectionConfigs["product_carousel"]): Promise<Product[]> => {
    const limit = c.limit ?? 12;
    if (c.source === "manual") return pick(c.productIds, limit);
    const category = c.source === "category" ? flat.find((x) => x.id === c.categoryId)?.slug : undefined;
    const collection = c.source === "collection" ? collections.find((x) => x.id === c.collectionId)?.slug : undefined;
    if ((c.source === "category" && !category) || (c.source === "collection" && !collection)) return [];
    const q = ProductQuerySchema.parse({ category, collection, sort: SOURCE_SORT[c.source], pageSize: limit });
    return (await listProducts(q, false)).items;
  };

  const resolved = await Promise.all(parsed.map(async (p): Promise<HomeSection | null> => {
    const base = { id: p.row.id, title: p.row.title ?? undefined, subtitle: p.row.subtitle ?? undefined, sortOrder: p.row.sort_order };
    switch (p.type) {
      case "hero_carousel": return { ...base, type: p.type, config: p.config };
      case "promo_banner": return { ...base, type: p.type, config: p.config };
      case "newsletter": return { ...base, type: p.type, config: p.config };
      case "tear_reveal": return { ...base, type: p.type, config: p.config };
      case "category_grid": {
        const list = p.config.categoryIds?.length
          ? p.config.categoryIds.flatMap((id) => flat.find((c) => c.id === id) ?? [])
          : flat.filter((c) => c.showOnHome);
        const categories = list.slice(0, p.config.limit ?? 12);
        return categories.length ? { ...base, type: p.type, config: p.config, categories } : null;
      }
      case "collection_rail": {
        const list = p.config.collectionIds?.length
          ? p.config.collectionIds.flatMap((id) => collections.find((c) => c.id === id) ?? [])
          : collections.filter((c) => c.showOnHome);
        const cols = list.slice(0, p.config.limit ?? 8);
        return cols.length ? { ...base, type: p.type, config: p.config, collections: cols } : null;
      }
      case "product_carousel": {
        const products = await carousel(p.config);
        return products.length ? { ...base, type: p.type, config: p.config, products } : null;
      }
      case "floating_showcase": {
        const products = pick(p.config.productIds);
        return products.length ? { ...base, type: p.type, config: p.config, products } : null;
      }
      case "testimonials": {
        const testimonials = await listTestimonials(p.config.limit ?? 6, p.config.testimonialIds);
        return testimonials.length ? { ...base, type: p.type, config: p.config, testimonials } : null;
      }
      case "blog_rail": {
        const posts = (await listBlogPosts({ pageSize: p.config.limit ?? 3, category: p.config.categorySlug })).items;
        return posts.length ? { ...base, type: p.type, config: p.config, posts } : null;
      }
    }
  }));
  return resolved.filter((s): s is HomeSection => s !== null);
});
