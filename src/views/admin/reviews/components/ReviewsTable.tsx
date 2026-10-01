"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useCan } from "@/components/admin/useRole";
import { adminCopy } from "@/data/copy";
import type { AdminReview } from "@/types/admin";
import type { REVIEW_STATUS } from "@/types/domain";
import { useAct } from "../../orders/components/act";
import { DeleteDialog } from "../../orders/components/DeleteDialog";
import { fmtDateTime } from "../../orders/components/fmt";

type Status = (typeof REVIEW_STATUS)[number];
const rc = adminCopy.remove;

/** Moderation table for one server page of reviews: per-row and bulk status changes, each an explicit click. */
export function ReviewsTable({ reviews }: { reviews: AdminReview[] }) {
  const { busy, run } = useAct();
  const canDelete = useCan("reviews.moderate");
  const [sel, setSel] = useState<Set<string>>(new Set());
  if (!reviews.length) return <EmptyState title="No reviews match" />;
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const moderate = async (ids: string[], status: Status) => {
    if ((await run("POST", "reviews/moderate", { ids, status }, `${ids.length} review(s) ${status}`)).ok) setSel(new Set());
  };
  const remove = async (ids: string[]) => {
    const res = await run<{ deleted: number }>("DELETE", ids.length === 1 ? `reviews/${ids[0]}` : "reviews", ids.length === 1 ? undefined : { ids },
      ids.length === 1 ? rc.reviewDeleted : rc.reviewsDeleted(ids.length));
    if (res.ok) setSel((s) => new Set([...s].filter((id) => !ids.includes(id))));
    return res.ok;
  };
  const ids = [...sel];

  return (
    <div className="rounded-lg border border-line bg-surface">
      {ids.length > 0 && (
        <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-warm px-4 py-2">
          <span className="text-meta font-medium">{ids.length} selected</span>
          <Button size="sm" loading={busy} onClick={() => void moderate(ids, "approved")}>Approve</Button>
          <Button size="sm" variant="secondary" loading={busy} onClick={() => void moderate(ids, "rejected")}>Reject</Button>
          <Button size="sm" variant="ghost" loading={busy} onClick={() => void moderate(ids, "hidden")}>Hide</Button>
          {canDelete && <DeleteDialog title={rc.reviewsTitle(ids.length)} body={rc.reviewsBody} onConfirm={() => remove(ids)} />}
        </div>
      )}
      <ul className="divide-y divide-line-soft">
        {reviews.map((r) => (
          <li key={r.id} className="flex flex-wrap gap-3 p-4">
            <input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select review by ${r.authorName}`} className="mt-1 size-4 accent-ink" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                <span role="img" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span></span> {r.title}
              </p>
              <p className="text-body text-ink-soft line-clamp-3">{r.body}</p>
              <p className="t-meta mt-1 flex flex-wrap items-center gap-2">
                {r.authorName} · {r.productName ?? "Unknown product"} · {fmtDateTime(r.createdAt)} · {r.source}
                {r.verifiedPurchase ? <Badge tone="success">Verified purchase</Badge> : <Badge>Unverified</Badge>}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2 max-sm:basis-full max-sm:flex-row max-sm:flex-wrap max-sm:items-center max-sm:pl-7">
              <StatusBadge status={r.status} />
              <span className="flex flex-wrap justify-end gap-1">
                {r.status !== "approved" && <Button size="sm" variant="secondary" loading={busy} onClick={() => void moderate([r.id], "approved")}>Approve</Button>}
                {r.status !== "rejected" && <Button size="sm" variant="ghost" loading={busy} onClick={() => void moderate([r.id], "rejected")}>Reject</Button>}
                {r.status === "approved" && <Button size="sm" variant="ghost" loading={busy} onClick={() => void moderate([r.id], "hidden")}>Hide</Button>}
                <Link href={`/admin/reviews/${r.id}/edit`} className="inline-flex h-11 items-center px-3 text-meta underline sm:h-9">Edit</Link>
                {canDelete && <DeleteDialog title={rc.reviewTitle} body={rc.reviewBody(r.authorName, r.productName ?? "Unknown product")}
                  ariaLabel={rc.deleteLabel(`review by ${r.authorName}`)} onConfirm={() => remove([r.id])} />}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
