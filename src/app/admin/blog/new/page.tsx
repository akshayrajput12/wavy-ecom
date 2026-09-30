import { BlogEditorView } from "@/views/admin/blog/EditorView";

export const metadata = { title: "New post" };

export default function Page() {
  return <BlogEditorView post={null} />;
}
