import { notFound } from "next/navigation";
import { getProduct, listCategoryOptions, listCollections } from "@/backend/admin/repo";
import { ProductEditorView } from "@/views/admin/product-editor/View";

export const metadata = { title: "Edit product" };

export default async function Page({ params }: PageProps<"/admin/products/[slug]/edit">) {
  const { slug } = await params;
  const [product, categories, collections] = await Promise.all([getProduct(slug), listCategoryOptions(), listCollections()]);
  if (!product) notFound();
  return <ProductEditorView key={product.updatedAt} product={product} categories={categories} collections={collections} />;
}
