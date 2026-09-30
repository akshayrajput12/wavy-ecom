import { listFaqs } from "@/backend/admin/repo";
import { FaqsView } from "@/views/admin/faqs/View";

export const metadata = { title: "FAQs" };

export default async function Page() {
  return <FaqsView faqs={await listFaqs()} />;
}
