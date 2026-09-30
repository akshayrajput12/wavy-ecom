import { listCategoryOptions, listCollections, listProducts } from "@/backend/admin/repo";
import { ProductListQuery } from "@/backend/admin/schemas/catalog";
import { ProductsView } from "@/views/admin/products/View";

export const metadata = { title: "Products" };

export default async function Page({ searchParams }: PageProps<"/admin/products">) {
  const raw = await searchParams;
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = ProductListQuery.safeParse(flat);
  const query = parsed.success ? parsed.data : ProductListQuery.parse({});
  const [data, categories, collections] = await Promise.all([listProducts(query), listCategoryOptions(), listCollections()]);
  return <ProductsView data={data} query={query} categories={categories} collections={collections} />;
}
