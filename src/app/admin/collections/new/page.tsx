import { listProductOptions } from "@/backend/admin/repo";
import { CollectionEditorView } from "@/views/admin/collection-editor/View";

export const metadata = { title: "New collection" };

export default async function Page() {
  const products = await listProductOptions();
  return <CollectionEditorView collection={null} products={products.map((p) => ({ id: p.id, label: p.name }))} />;
}
