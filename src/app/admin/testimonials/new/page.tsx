import { listProductOptions } from "@/backend/admin/repo";
import { TestimonialEditorView } from "@/views/admin/testimonials/EditorView";

export const metadata = { title: "New testimonial" };

export default async function Page() {
  return <TestimonialEditorView products={(await listProductOptions()).map(({ id, name }) => ({ id, name }))} />;
}
