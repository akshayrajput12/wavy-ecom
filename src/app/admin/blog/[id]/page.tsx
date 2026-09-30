import { notFound } from "next/navigation";
import { getBlogPost } from "@/backend/admin/repo";
import { BlogEditorView } from "@/views/admin/blog/EditorView";

export const metadata = { title: "Edit post" };

export default async function Page({ params }: PageProps<"/admin/blog/[id]">) {
  const post = await getBlogPost((await params).id);
  if (!post) notFound();
  return <BlogEditorView post={post} />;
}
