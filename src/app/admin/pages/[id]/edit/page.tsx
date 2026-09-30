import { notFound } from "next/navigation";
import { getResource } from "@/backend/admin/repo";
import type { AdminContentPage } from "@/types/admin";
import { PageEditorView } from "@/views/admin/pages/EditorView";

export const metadata = { title: "Edit page" };

export default async function Page({ params }: PageProps<"/admin/pages/[id]/edit">) {
  const { id } = await params;
  const page = await getResource<AdminContentPage>("pages", id);
  if (!page) notFound();
  return <PageEditorView page={page} />;
}
