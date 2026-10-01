import { clsx } from "clsx";
import { useId } from "react";
import { productCopy as c } from "@/data/copy";

// lucide "star" path (24x24). Drawn once per rating and reused with <use>.
const STAR =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

/**
 * Five ink stars clipped to the rating; the numeric value is always shown as text.
 * `outOf` renders the compact card form "4.9/5" instead of "4.9 (12)".
 * One SVG per rating (was 10 icon SVGs): product grids render dozens of these, so it trims HTML + RSC payload.
 */
export function RatingStars({ rating, count, size = "sm", outOf, className }: {
  rating: number; count?: number; size?: "sm" | "md"; outOf?: boolean; className?: string;
}) {
  const id = useId();
  const px = size === "md" ? 16 : 12;
  const gap = (2 * 24) / px;               // 2px between stars, in viewBox units
  const width = 5 * 24 + 4 * gap;
  const xs = [0, 1, 2, 3, 4].map((i) => i * (24 + gap));
  const fill = Math.round(((width * Math.min(Math.max(rating, 0), 5)) / 5) * 100) / 100;
  const value = rating.toFixed(1);
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-meta text-ink-soft", className)}>
      <svg viewBox={`0 0 ${width} 24`} width={(width * px) / 24} height={px} aria-hidden className="shrink-0">
        <defs>
          <path id={`${id}s`} d={STAR} />
          <clipPath id={`${id}c`}><rect width={fill} height="24" /></clipPath>
        </defs>
        <g className="text-line" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          {xs.map((x) => <use key={x} href={`#${id}s`} x={x} />)}
        </g>
        <g className="text-rating" fill="currentColor" clipPath={`url(#${id}c)`}>
          {xs.map((x) => <use key={x} href={`#${id}s`} x={x} />)}
        </g>
      </svg>
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
