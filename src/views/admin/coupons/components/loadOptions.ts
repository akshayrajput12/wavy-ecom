import "server-only";
import { listCategoryOptions, listCollections, listProductOptions } from "@/backend/admin/repo";
import type { TargetOptions } from "./TargetPicker";

/** Data for the targeting pickers (coupon and offer forms). */
export async function loadTargetOptions(): Promise<TargetOptions> {
  const [products, categories, collections] = await Promise.all([listProductOptions(), listCategoryOptions(), listCollections()]);
  return {
    products: products.map(({ id, name, slug }) => ({ id, name, slug })),
    categories: categories.map(({ id, name, depth }) => ({ id, name, depth })),
    collections: collections.map(({ id, name }) => ({ id, name })),
  };
}
