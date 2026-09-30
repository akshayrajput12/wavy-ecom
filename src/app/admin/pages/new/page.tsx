import { PageEditorView } from "@/views/admin/pages/EditorView";

export const metadata = { title: "New page" };

export default function Page() {
  return <PageEditorView page={null} />;
}
