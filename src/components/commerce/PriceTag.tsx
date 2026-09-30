import { clsx } from "clsx";
import { formatPrice } from "@/lib/format";

/** Price in paise; shows compare-at strike-through and % off when discounted. */
export function PriceTag({ price, compareAt, size = "sm", className }: { price: number; compareAt?: number; size?: "sm" | "lg"; className?: string }) {
  const onSale = !!compareAt && compareAt > price;
  return (
    <p className={clsx("flex flex-wrap items-baseline gap-x-2 tabular-nums", size === "lg" ? "text-h2 font-medium" : "text-body font-medium", className)}>
      <span className={clsx(onSale && "text-accent-deep")}>{formatPrice(price)}</span>
      {onSale && (
        <>
          <s className={clsx("text-ink-muted", size === "lg" ? "text-body-lg" : "text-meta")}>
            <span className="sr-only">Was </span>{formatPrice(compareAt)}
          </s>
          <span className="text-meta font-semibold text-accent-deep">{Math.round((1 - price / compareAt) * 100)}% off</span>
        </>
      )}
    </p>
  );
}
