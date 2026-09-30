import { notFound } from "next/navigation";
import { listStaff } from "@/backend/admin/repo";
import { StaffEditorView } from "@/views/admin/staff/EditorView";

export const metadata = { title: "Edit staff member" };

export default async function Page({ params }: PageProps<"/admin/staff/[id]/edit">) {
  const { id } = await params;
  const member = (await listStaff()).find((s) => s.id === id);
  if (!member) notFound();
  return <StaffEditorView member={member} />;
}
