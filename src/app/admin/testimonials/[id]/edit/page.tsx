import { notFound } from "next/navigation";
import { getResource, listProductOptions } from "@/backend/admin/repo";
import type { AdminTestimonial } from "@/types/admin";
import { TestimonialEditorView } from "@/views/admin/testimonials/EditorView";

export const metadata = { title: "Edit testimonial" };

export default async function Page({ params }: PageProps<"/admin/testimonials/[id]/edit">) {
  const [testimonial, products] = await Promise.all([params.then((p) => getResource<AdminTestimonial>("testimonials", p.id)), listProductOptions()]);
  if (!testimonial) notFound();
  return <TestimonialEditorView testimonial={testimonial} products={products.map(({ id, name }) => ({ id, name }))} />;
}
