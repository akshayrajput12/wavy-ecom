import { listCategoryTree } from "@/backend/admin/repo";
import { CategoriesView } from "@/views/admin/categories/View";

export const metadata = { title: "Categories" };

export default async function Page() {
  return <CategoriesView categories={await listCategoryTree()} />;
}
