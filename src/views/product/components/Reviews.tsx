"use client";

import { useState } from "react";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Chip, Select } from "@/components/ui/Controls";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/commerce/RatingStars";
import { formatDate } from "@/lib/format";
import { reviewsCopy as c } from "@/data/copy";
import { paginationCopy, reviewFormCopy } from "@/data/storefront";
import type { ReviewPage } from "@/backend/reviews/repo";
import { ReviewForm } from "./ReviewForm";

type Query = { sort: string; rating?: number; page: number };

/** Summary + histogram filter, sort and pagination against GET /api/reviews; helpful votes; write-review dialog. */
export function Reviews({ productId, productName, initial }: { productId: string; productName: string; initial: ReviewPage }) {
  const [data, setData] = useState(initial);
  const [query, setQuery] = useState<Query>({ sort: "recent", page: 1 });
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);
  const { summary } = initial;
  const pages = Math.ceil(data.total / data.pageSize);

  async function load(next: Query) {
    setQuery(next);
    setLoading(true);
    try {
      const qs = new URLSearchParams({ productId, sort: next.sort, page: String(next.page), pageSize: String(initial.pageSize) });
      if (next.rating) qs.set("rating", String(next.rating));
      const json = (await (await fetch(`/api/reviews?${qs}`)).json()) as { ok: boolean; data?: ReviewPage };
      if (!json.ok || !json.data) throw new Error("reviews_failed");
      setData(json.data);
    } catch {
      toast.error(reviewFormCopy.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  async function vote(id: string) {
    const res = await fetch(`/api/reviews/${id}/vote`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ helpful: true }) });
    if (res.status === 401) toast(c.signInToReview);
    else if (res.ok) toast.success(reviewFormCopy.voted);
  }

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="grid scroll-mt-24 gap-10 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-4">
        <h2 id="reviews-title" className="t-display">{c.title}</h2>
        {summary.count > 0 && (
          <>
            <p className="t-hero mt-6 tabular-nums">{summary.average.toFixed(1)}<span className="text-h2 text-ink-soft">/5</span></p>
            <RatingStars rating={summary.average} size="md" className="mt-2" />
            <p className="mt-1 text-meta text-ink-soft">{c.basedOn(summary.count)}</p>
            <ul className="mt-6 space-y-1">
              {([5, 4, 3, 2, 1] as const).map((s) => (
                <li key={s}>
                  <button type="button" aria-pressed={query.rating === s} onClick={() => load({ ...query, rating: query.rating === s ? undefined : s, page: 1 })}
                    className="flex min-h-11 w-full items-center gap-3 rounded-pill px-2 text-meta transition-colors hover:bg-surface-warm aria-pressed:bg-surface-2 aria-pressed:font-semibold">
                    <span className="w-9 tabular-nums">{s} ★</span>
                    <span className="h-1 flex-1 overflow-hidden rounded-pill bg-line" aria-hidden>
                      <span className="block h-full origin-left rounded-pill bg-rating" style={{ transform: `scaleX(${summary.count ? summary.histogram[s] / summary.count : 0})` }} />
                    </span>
                    <span className="w-8 text-right tabular-nums text-ink-soft">{summary.histogram[s]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <Button variant="secondary" className="mt-6" onClick={() => setWriting(true)}>{c.write}</Button>
        <ReviewForm open={writing} onClose={() => setWriting(false)} productId={productId} productName={productName} />
      </div>

      <div className="lg:col-span-8" aria-busy={loading}>
        {summary.count > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div className="flex gap-2">
              <Chip active={!query.rating} onClick={() => load({ ...query, rating: undefined, page: 1 })}>{c.all}</Chip>
              {query.rating && <Chip onRemove={() => load({ ...query, rating: undefined, page: 1 })}>{query.rating} ★</Chip>}
            </div>
            <Select label={c.sort} hideLabel value={query.sort} onChange={(e) => load({ ...query, sort: e.target.value, page: 1 })}>
              {c.sorts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </Select>
          </div>
        )}
        {data.items.length === 0 ? (
          <p className="py-10 text-body text-ink-soft">{c.empty}</p>
        ) : (
          <ul className={`divide-y divide-line transition-opacity duration-(--dur-base) ${loading ? "opacity-50" : ""}`}>
            {data.items.map((r) => (
              <li key={r.id} className="py-7">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <RatingStars rating={r.rating} />
                  <time dateTime={r.createdAt} className="text-meta text-ink-soft">{formatDate(r.createdAt)}</time>
                </div>
                <h3 className="mt-3 text-body-lg font-semibold">{r.title}</h3>
                <p className="mt-1.5 max-w-prose whitespace-pre-line text-body text-ink-soft">{r.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta">
                  <span className="font-medium">{r.author}{r.authorLocation && <span className="font-normal text-ink-soft"> · {r.authorLocation}</span>}</span>
                  {r.verifiedPurchase && <span className="inline-flex items-center gap-1 text-success"><BadgeCheck className="size-4" aria-hidden /> {c.verified}</span>}
                  <button type="button" onClick={() => vote(r.id)} className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-ink-soft hover:text-ink">
                    <ThumbsUp className="size-4" aria-hidden /> {c.helpful}{r.helpfulCount > 0 && ` (${r.helpfulCount})`}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {pages > 1 && (
          <nav aria-label={paginationCopy.label} className="mt-6 flex items-center justify-between gap-3">
            <Button variant="ghost" size="sm" disabled={query.page <= 1 || loading} onClick={() => load({ ...query, page: query.page - 1 })}>{paginationCopy.prev}</Button>
            <span className="text-meta text-ink-soft">{paginationCopy.page(query.page, pages)}</span>
            <Button variant="ghost" size="sm" disabled={query.page >= pages || loading} onClick={() => load({ ...query, page: query.page + 1 })}>{paginationCopy.next}</Button>
          </nav>
        )}
      </div>
    </section>
  );
}
