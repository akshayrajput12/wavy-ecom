import { notFound } from "next/navigation";
import { listIntegrations } from "@/backend/admin/repo";
import { IntegrationEditorView } from "@/views/admin/integrations/EditorView";

export const metadata = { title: "Edit integration" };

export default async function Page({ params }: PageProps<"/admin/integrations/[id]/edit">) {
  const { id } = await params;
  const item = (await listIntegrations()).find((i) => i.id === id);
  if (!item) notFound();
  return <IntegrationEditorView item={item} />;
}
