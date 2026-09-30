import { notFound } from "next/navigation";
import { getCategories, getProduct } from "@/backend/admin/repo";
import { ProductEditorView } from "@/views/admin/product-editor/View";

export const metadata = { title: "Edit product" };

export default async function Page({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getProduct(id), getCategories()]);
  if (!product) notFound();
  return <ProductEditorView product={product} categories={categories} />;
}
