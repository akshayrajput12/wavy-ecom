"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck } from "lucide-react";
import { Chip, Select } from "@/components/ui/Controls";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/commerce/RatingStars";
import { formatDate } from "@/lib/format";
import { reviewsCopy as c } from "@/data/content";
import type { Review } from "@/types/domain";

type Sort = (typeof c.sorts)[number]["id"];
const sorters: Record<Sort, (a: Review, b: Review) => number> = {
  recent: (a, b) => b.createdAt.localeCompare(a.createdAt),
  high: (a, b) => b.rating - a.rating,
  low: (a, b) => a.rating - b.rating,
};

/** Screen 12 — summary, star histogram as filter, sort, verified markers. */
export function Reviews({ reviews, rating, count }: { reviews: Review[]; rating: number; count: number }) {
  const [sort, setSort] = useState<Sort>("recent");
  const [stars, setStars] = useState<number>();
  const hist = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length }));
  const list = reviews.filter((r) => !stars || r.rating === stars).sort(sorters[sort]);

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-24 grid gap-10 lg:grid-cols-12 lg:gap-5">
      <div className="lg:col-span-4">
        <h2 id="reviews-title" className="t-h1">{c.title}</h2>
        <p className="mt-4 font-serif text-hero leading-none">{rating.toFixed(1)}</p>
        <RatingStars rating={rating} size="md" className="mt-2" />
        <p className="mt-1 text-meta text-ink-soft">{c.basedOn(count)}</p>
        <ul className="mt-6 space-y-1.5">
          {hist.map(({ s, n }) => (
            <li key={s}>
              <button type="button" onClick={() => setStars(stars === s ? undefined : s)} aria-pressed={stars === s}
                className="flex w-full items-center gap-3 rounded-sm py-1 text-meta hover:bg-surface-warm aria-pressed:font-semibold">
                <span className="w-8 tabular-nums">{s}★</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-pill bg-line-soft" aria-hidden>
                  <span className="block h-full rounded-pill bg-ink" style={{ width: `${reviews.length ? (n / reviews.length) * 100 : 0}%` }} />
                </span>
                <span className="w-6 text-right tabular-nums text-ink-soft">{n}</span>
              </button>
            </li>
          ))}
        </ul>
        <Button variant="secondary" className="mt-6" onClick={() => toast(c.writeNote)}>{c.write}</Button>
      </div>

      <div className="lg:col-span-7 lg:col-start-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex gap-2">
            <Chip active={!stars} onClick={() => setStars(undefined)}>{c.all}</Chip>
            {stars && <Chip onRemove={() => setStars(undefined)}>{stars}★</Chip>}
          </div>
          <Select label={c.sort} hideLabel value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            {c.sorts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        </div>
        {list.length === 0 ? (
          <p className="py-10 text-body text-ink-soft">{c.empty}</p>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((r) => (
              <li key={r.id} className="py-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <RatingStars rating={r.rating} />
                  <time dateTime={r.createdAt} className="text-meta text-ink-soft">{formatDate(r.createdAt)}</time>
                </div>
                <h3 className="mt-3 text-body-lg font-semibold">{r.title}</h3>
                <p className="mt-1.5 max-w-prose text-body text-ink-soft">{r.body}</p>
                <p className="mt-3 flex items-center gap-2 text-meta">
                  <span className="font-medium">{r.author}</span>
                  {r.verifiedPurchase && <span className="inline-flex items-center gap-1 text-success"><BadgeCheck className="size-4" aria-hidden /> {c.verified}</span>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
