import { notFound } from "next/navigation";
import { listBlogCategories, listBlogPosts } from "@/backend/admin/repo";
import { BlogListQuery } from "@/backend/admin/schemas/content";
import { BlogEditorView } from "@/views/admin/blog/EditorView";

export const metadata = { title: "Edit post" };

export default async function Page({ params }: PageProps<"/admin/blog/[slug]/edit">) {
  const { slug } = await params;
  // The repo has no by-slug getter: search matches title/slug, then pick the exact slug.
  const [found, categories] = await Promise.all([listBlogPosts(BlogListQuery.parse({ q: slug, pageSize: 100 })), listBlogCategories()]);
  const post = found.items.find((p) => p.slug === slug);
  if (!post) notFound();
  return <BlogEditorView post={post} categories={categories} />;
}
