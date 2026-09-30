import { notFound } from "next/navigation";
import { getResource } from "@/backend/admin/repo";
import type { AdminRedirect } from "@/types/admin";
import { RedirectEditorView } from "@/views/admin/seo/RedirectEditor";

export const metadata = { title: "Edit redirect" };

export default async function Page({ params }: PageProps<"/admin/seo/redirects/[id]/edit">) {
  const { id } = await params;
  const item = await getResource<AdminRedirect>("redirects", id);
  if (!item) notFound();
  return <RedirectEditorView item={item} />;
}
