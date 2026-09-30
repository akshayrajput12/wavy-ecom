import { getTestimonials } from "@/backend/admin/repo";
import { TestimonialsView } from "@/views/admin/testimonials/View";

export const metadata = { title: "Testimonials" };

export default async function Page() {
  return <TestimonialsView testimonials={await getTestimonials()} />;
}
