import { clsx } from "clsx";
import { Star } from "lucide-react";

/** Five stars clipped to the rating; the numeric value is always available as text. */
export function RatingStars({ rating, count, size = "sm", className }: { rating: number; count?: number; size?: "sm" | "md"; className?: string }) {
  const icon = size === "md" ? "size-4" : "size-3";
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
      <span className="sr-only">Rated {rating.toFixed(1)} out of 5</span>
      <span aria-hidden className="font-medium text-ink">{rating.toFixed(1)}</span>
      {count !== undefined && <span>({count}<span className="sr-only"> reviews</span>)</span>}
    </span>
  );
}
