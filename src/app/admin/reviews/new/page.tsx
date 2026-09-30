import { listProductOptions } from "@/backend/admin/repo";
import { ReviewComposerView } from "@/views/admin/review-composer/View";

export const metadata = { title: "Add review" };

export default async function Page() {
  return <ReviewComposerView products={(await listProductOptions()).map(({ id, name, slug }) => ({ id, name, slug }))} />;
}
