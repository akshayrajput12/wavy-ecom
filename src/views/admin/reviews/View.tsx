"use client";

import { BadgeCheck } from "lucide-react";
import { useState } from "react";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { formatDate } from "@/lib/format";
import { REVIEW_STATUS, type Product, type Review, type ReviewStatus } from "@/types/domain";
import { mutate } from "../api";

export function ReviewsView({ reviews, products }: { reviews: Review[]; products: Pick<Product, "id" | "name">[] }) {
  const [rows, setRows] = useState(reviews);
  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id;

  const moderate = (ids: string[], status: ReviewStatus) => {
    const before = rows;
    setRows(rows.map((r) => (ids.includes(r.id) ? { ...r, status } : r)));
    // TODO(backend agent): call /api/admin/reviews/moderate (recomputes product rating)
    void mutate("reviews/moderate", { ids, status }, { success: `${ids.length} review(s) ${status}`, rollback: () => setRows(before) });
  };

  const columns: Column<Review>[] = [
    { key: "review", header: "Review", className: "max-w-md", cell: (r) => (
      <div>
        <p className="font-medium"><span aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span></span> {r.title}</p>
        <p className="t-meta line-clamp-2">{r.body}</p>
      </div>
    ) },
    { key: "product", header: "Product", sort: (r) => productName(r.productId), cell: (r) => productName(r.productId) },
    { key: "author", header: "Author", cell: (r) => (
      <span className="flex flex-col items-start gap-1">{r.author}
        {r.verifiedPurchase ? <Badge tone="success"><BadgeCheck className="size-3" aria-hidden />Verified purchase</Badge> : <Badge>Unverified</Badge>}
      </span>
    ) },
    { key: "date", header: "Date", sort: (r) => r.createdAt, cell: (r) => formatDate(r.createdAt) },
    { key: "status", header: "Status", sort: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
    { key: "act", header: "Actions", cell: (r) => (
      <span className="flex gap-1">
        {r.status !== "approved" && <Button size="sm" variant="secondary" onClick={() => moderate([r.id], "approved")}>Approve</Button>}
        {r.status !== "rejected" && <Button size="sm" variant="ghost" onClick={() => moderate([r.id], "rejected")}>Reject</Button>}
        {r.status === "approved" && <Button size="sm" variant="ghost" onClick={() => moderate([r.id], "hidden")}>Hide</Button>}
      </span>
    ) },
  ];

  return (
    <>
      <PageHeader title="Reviews" description="Moderate customer reviews. Verified marks come only from real orders."
        actions={<ButtonLink href="/admin/reviews/new" size="sm" variant="secondary">Compose review</ButtonLink>} />
      <DataTable
        caption="Reviews" rows={rows} columns={columns} getId={(r) => r.id}
        search={(r) => `${r.title} ${r.body} ${r.author}`} searchPlaceholder="Search review text or author"
        initialFilters={{ status: "pending" }}
        filters={[
          { key: "status", label: "Status", options: REVIEW_STATUS.map((s) => ({ value: s, label: s })), match: (r, v) => r.status === v },
          { key: "verified", label: "Purchase", options: [{ value: "yes", label: "Verified" }, { value: "no", label: "Unverified" }], match: (r, v) => r.verifiedPurchase === (v === "yes") },
        ]}
        bulkActions={[
          { label: "Approve", onClick: (ids) => moderate(ids, "approved") },
          { label: "Reject", danger: true, onClick: (ids) => moderate(ids, "rejected") },
        ]}
        empty={{ title: "No reviews yet" }}
      />
    </>
  );
}
