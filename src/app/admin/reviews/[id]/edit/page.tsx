import { notFound } from "next/navigation";
import { listProductOptions, listReviews } from "@/backend/admin/repo";
import { ReviewComposerView } from "@/views/admin/review-composer/View";

export const metadata = { title: "Edit review" };

/** ponytail: no getReview(id) getter exists, so scan pages of 100 until found. Add a getter if review volume gets large. */
async function findReview(id: string) {
  for (let page = 1; page <= 50; page++) {
    const res = await listReviews({ page, pageSize: 100 });
    const hit = res.items.find((r) => r.id === id);
    if (hit || page * res.pageSize >= res.total) return hit ?? null;
  }
  return null;
}

export default async function Page({ params }: PageProps<"/admin/reviews/[id]/edit">) {
  const [review, products] = await Promise.all([params.then((p) => findReview(p.id)), listProductOptions()]);
  if (!review) notFound();
  return <ReviewComposerView review={review} products={products.map(({ id, name, slug }) => ({ id, name, slug }))} />;
}
