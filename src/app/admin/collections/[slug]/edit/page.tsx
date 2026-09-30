import { notFound } from "next/navigation";
import { getCollection, listProductOptions } from "@/backend/admin/repo";
import { CollectionEditorView } from "@/views/admin/collection-editor/View";

export const metadata = { title: "Edit collection" };

export default async function Page({ params }: PageProps<"/admin/collections/[slug]/edit">) {
  const { slug } = await params;
  const [collection, products] = await Promise.all([getCollection(slug), listProductOptions()]);
  if (!collection) notFound();
  return <CollectionEditorView collection={collection} products={products.map((p) => ({ id: p.id, label: p.name }))} />;
}
