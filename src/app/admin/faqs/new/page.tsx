import { FaqEditorView } from "@/views/admin/faqs/EditorView";

export const metadata = { title: "New FAQ" };

export default function Page() {
  return <FaqEditorView faq={null} />;
}
