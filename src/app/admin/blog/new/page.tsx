import { listBlogCategories } from "@/backend/admin/repo";
import { BlogEditorView } from "@/views/admin/blog/EditorView";

export const metadata = { title: "New post" };

export default async function Page() {
  return <BlogEditorView post={null} categories={await listBlogCategories()} />;
}
