import { listCategoryTree } from "@/backend/admin/repo";
import { CategoryEditorView } from "@/views/admin/category-editor/View";

export const metadata = { title: "New category" };

export default async function Page() {
  return <CategoryEditorView category={null} tree={await listCategoryTree()} />;
}
