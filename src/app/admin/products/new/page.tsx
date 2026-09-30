import { getCategories } from "@/backend/admin/repo";
import { ProductEditorView } from "@/views/admin/product-editor/View";

export const metadata = { title: "New product" };

export default async function Page() {
  return <ProductEditorView product={null} categories={await getCategories()} />;
}
