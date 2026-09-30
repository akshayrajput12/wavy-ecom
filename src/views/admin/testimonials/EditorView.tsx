import { PageHeader } from "@/components/admin/Panel";
import type { AdminTestimonial } from "@/types/admin";
import { TestimonialForm } from "./components/TestimonialForm";

export function TestimonialEditorView({ testimonial, products }: { testimonial?: AdminTestimonial; products: { id: string; name: string }[] }) {
  return (
    <>
      <PageHeader title={testimonial ? `Edit ${testimonial.authorName}` : "New testimonial"} />
      <TestimonialForm testimonial={testimonial} products={products} />
    </>
  );
}
