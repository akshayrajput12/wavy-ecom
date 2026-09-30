import { notFound } from "next/navigation";
import { listCategoryTree } from "@/backend/admin/repo";
import type { AdminCategory } from "@/types/admin";
import { CategoryEditorView } from "@/views/admin/category-editor/View";

export const metadata = { title: "Edit category" };

const find = (nodes: AdminCategory[], slug: string): AdminCategory | null =>
  nodes.reduce<AdminCategory | null>((hit, n) => hit ?? (n.slug === slug ? n : find(n.children, slug)), null);

export default async function Page({ params }: PageProps<"/admin/categories/[slug]/edit">) {
  const { slug } = await params;
  const tree = await listCategoryTree();
  const category = find(tree, slug);
  if (!category) notFound();
  return <CategoryEditorView category={category} tree={tree} />;
}
