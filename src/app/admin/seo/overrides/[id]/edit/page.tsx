import { notFound } from "next/navigation";
import { getResource } from "@/backend/admin/repo";
import type { AdminSeoOverride } from "@/types/admin";
import { OverrideEditorView } from "@/views/admin/seo/OverrideEditor";

export const metadata = { title: "Edit SEO override" };

export default async function Page({ params }: PageProps<"/admin/seo/overrides/[id]/edit">) {
  const { id } = await params;
  const item = await getResource<AdminSeoOverride>("seo-overrides", id);
  if (!item) notFound();
  return <OverrideEditorView item={item} />;
}
