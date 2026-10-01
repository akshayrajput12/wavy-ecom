import { clsx } from "clsx";
import { productCopy as c } from "@/data/copy";
import { formatPrice } from "@/lib/format";

/** Price in paise; `from` prefixes "From" (cards); compare-at strike-through + % off when discounted. */
export function PriceTag({ price, compareAt, size = "sm", from, className }: {
  price: number; compareAt?: number; size?: "sm" | "lg"; from?: boolean; className?: string;
}) {
  const onSale = !!compareAt && compareAt > price;
  const lg = size === "lg";
  return (
    <p className={clsx("flex flex-wrap items-baseline gap-x-2 gap-y-1 tabular-nums", lg ? "text-h2 font-semibold tracking-tight" : "text-meta font-medium text-ink", className)}>
      {from && <span className={clsx("font-normal text-ink-soft", lg ? "text-body" : "text-meta")}>{c.from}</span>}
      <span>{formatPrice(price)}</span>
      {onSale && (
        <>
          <s className={clsx("font-normal text-ink-muted", lg ? "text-body-lg" : "text-micro")}>
            <span className="sr-only">{c.was} </span>{formatPrice(compareAt)}
          </s>
          <span className={clsx("self-center rounded-pill bg-ink px-2 font-medium text-canvas", lg ? "text-meta" : "text-micro")}>
            {c.off(Math.round((1 - price / compareAt) * 100))}
          </span>
        </>
      )}
    </p>
  );
}
