import { getProducts } from "@/backend/admin/repo";
import { ReviewComposerView } from "@/views/admin/review-composer/View";

export const metadata = { title: "Compose review" };

export default async function Page() {
  const products = await getProducts();
  return <ReviewComposerView products={products.map(({ id, name }) => ({ id, name }))} />;
}
