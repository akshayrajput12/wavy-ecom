import { getProducts, getReviews } from "@/backend/admin/repo";
import { ReviewsView } from "@/views/admin/reviews/View";

export const metadata = { title: "Reviews" };

export default async function Page() {
  const [reviews, products] = await Promise.all([getReviews(), getProducts()]);
  return <ReviewsView reviews={reviews} products={products.map(({ id, name }) => ({ id, name }))} />;
}
