import { notFound } from "next/navigation";
import { getResource } from "@/backend/admin/repo";
import type { AdminFaq } from "@/types/admin";
import { FaqEditorView } from "@/views/admin/faqs/EditorView";

export const metadata = { title: "Edit FAQ" };

export default async function Page({ params }: PageProps<"/admin/faqs/[id]/edit">) {
  const { id } = await params;
  const faq = await getResource<AdminFaq>("faqs", id);
  if (!faq) notFound();
  return <FaqEditorView faq={faq} />;
}
