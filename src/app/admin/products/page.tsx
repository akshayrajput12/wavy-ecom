import { getCategories, getProducts } from "@/backend/admin/repo";
import { ProductsView } from "@/views/admin/products/View";

export const metadata = { title: "Products" };

export default async function Page() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  return <ProductsView products={products} categories={categories} />;
}
