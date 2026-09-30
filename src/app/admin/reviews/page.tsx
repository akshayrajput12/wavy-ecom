import { listReviews } from "@/backend/admin/repo";
import { ReviewListQuery } from "@/backend/admin/schemas/marketing";
import { parseListQuery } from "@/views/admin/orders/components/query";
import { ReviewsView } from "@/views/admin/reviews/View";

export const metadata = { title: "Reviews" };

export default async function Page({ searchParams }: PageProps<"/admin/reviews">) {
  return <ReviewsView reviews={await listReviews(parseListQuery(ReviewListQuery, await searchParams))} />;
}
