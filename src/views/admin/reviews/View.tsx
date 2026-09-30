import { PageHeader } from "@/components/admin/Panel";
import { ButtonLink } from "@/components/ui/Button";
import type { AdminReview, Paginated } from "@/types/admin";
import { REVIEW_STATUS } from "@/types/domain";
import { FilterBar, opts, Pager } from "../orders/components/list";
import { ReviewsTable } from "./components/ReviewsTable";

export function ReviewsView({ reviews }: { reviews: Paginated<AdminReview> }) {
  return (
    <>
      <PageHeader title="Reviews" description="Moderate customer reviews. Verified marks come only from real orders."
        actions={<ButtonLink href="/admin/reviews/new" size="sm" variant="secondary">Add review</ButtonLink>} />
      <FilterBar filters={[
        { key: "q", label: "Search text or author" }, { key: "status", label: "Status", options: opts(REVIEW_STATUS) },
        { key: "source", label: "Source", options: opts(["customer", "admin", "import"]) }, { key: "rating", label: "Rating", options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} stars` })) },
      ]} />
      <ReviewsTable reviews={reviews.items} />
      <Pager page={reviews.page} pageSize={reviews.pageSize} total={reviews.total} />
    </>
  );
}
