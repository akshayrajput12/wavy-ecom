import { listCategoryOptions, listCollections } from "@/backend/admin/repo";
import { ProductEditorView } from "@/views/admin/product-editor/View";

export const metadata = { title: "New product" };

export default async function Page() {
  const [categories, collections] = await Promise.all([listCategoryOptions(), listCollections()]);
  return <ProductEditorView product={null} categories={categories} collections={collections} />;
}
