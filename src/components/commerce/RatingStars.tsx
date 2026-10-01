import { clsx } from "clsx";
import { Star } from "lucide-react";
import { productCopy as c } from "@/data/copy";

/**
 * Five ink stars clipped to the rating; the numeric value is always shown as text.
 * `outOf` renders the compact card form "4.9/5" instead of "4.9 (12)".
 */
export function RatingStars({ rating, count, size = "sm", outOf, className }: {
  rating: number; count?: number; size?: "sm" | "md"; outOf?: boolean; className?: string;
}) {
  const icon = size === "md" ? "size-4" : "size-3";
  const value = rating.toFixed(1);
  const row = (filled: boolean) => (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={clsx(icon, filled ? "fill-rating text-rating" : "text-line")} strokeWidth={filled ? 0 : 1.5} aria-hidden />
      ))}
    </span>
  );
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-meta text-ink-soft", className)}>
      <span className="relative inline-flex" aria-hidden>
        {row(false)}
        <span className="absolute inset-0 overflow-hidden" style={{ width: `${(rating / 5) * 100}%` }}>{row(true)}</span>
      </span>
      <span className="sr-only">{c.rated(value)}{count !== undefined && `, ${c.reviewsCount(count)}`}</span>
      {outOf ? (
        <span aria-hidden className="tabular-nums">{value}/5</span>
      ) : (
        <>
          <span aria-hidden className="font-medium tabular-nums text-ink">{value}</span>
          {count !== undefined && <span aria-hidden className="tabular-nums">({count})</span>}
        </>
      )}
    </span>
  );
}
