"use client";

import type { ReactNode, Ref } from "react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/Controls";
import { productCopy as c } from "@/data/copy";
import { pdpCopy } from "@/data/storefront";
import { formatPrice } from "@/lib/format";
import type { Product, ProductVariant } from "@/types/domain";
import { addToBag } from "./addToBag";
import { OptionPicker } from "./OptionPicker";
import { PriceTag } from "./PriceTag";
import { RatingStars } from "./RatingStars";
import { StockNote } from "./StockNote";
import { WishlistButton } from "./WishlistButton";
import { inStock, type Selection } from "./variantSelect";

export const MAX_QTY = 10;

/**
 * Shared buy box (PDP info column + Quick View): overline, title, rating, price, options, stock, quantity,
 * ink "Add to bag" pill + wishlist. Prices shown are display values; the server re-quotes the bag.
 */
export function BuyBox({ product: p, variant, selection, onSelect, qty, onQty, idPrefix, titleId, titleAs: Title = "h2", reviewsHref, ctaRef, onAdded, children }: {
  product: Product; variant?: ProductVariant; selection: Selection; onSelect: (s: Selection) => void;
  qty: number; onQty: (n: number) => void; idPrefix: string; titleId?: string; titleAs?: "h1" | "h2";
  reviewsHref?: string; ctaRef?: Ref<HTMLDivElement>; onAdded?: () => void; children?: ReactNode;
}) {
  const canBuy = !!variant && inStock(variant);
  const max = variant ? Math.min(variant.stock, MAX_QTY) : 1;
  const price = variant?.price ?? p.priceFrom;
  const compareAt = variant ? variant.compareAt : p.compareAtFrom;
  const overline = p.category?.name ?? p.brand;
  const add = () => {
    if (!variant || !canBuy) return;
    addToBag(p, variant, Math.min(qty, max));
    onAdded?.();
  };
  const rating = p.reviewCount > 0 && <RatingStars rating={p.rating} count={p.reviewCount} size="md" />;

  return (
    <div className="space-y-6">
      <div>
        {overline && <p className="t-overline">{overline}</p>}
        <Title id={titleId} className={clsx("t-h1 mt-2", Title === "h2" && "pr-12 md:pr-0")}>{p.name}</Title>
        {rating && (reviewsHref
          ? <a href={reviewsHref} className="mt-1 inline-flex min-h-11 items-center gap-2 hover:underline hover:underline-offset-4">{rating}</a>
          : <div className="mt-2">{rating}</div>)}
      </div>

      <div className="border-b border-line pb-6">
        <PriceTag price={price} compareAt={compareAt} size="lg" />
        {compareAt && compareAt > price && <p className="mt-1 text-meta font-medium text-ink">{pdpCopy.youSave(formatPrice(compareAt - price))}</p>}
        <p className="mt-1 text-micro text-ink-soft">{c.inclusive}</p>
        {p.shortDescription && <p className="mt-4 text-body text-ink-soft">{p.shortDescription}</p>}
      </div>

      <OptionPicker product={p} selection={selection} onChange={(s) => { onSelect(s); onQty(1); }} idPrefix={idPrefix} />

      <div ref={ctaRef} className="space-y-4">
        <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
          <StockNote variant={variant} />
          {canBuy && <QuantityStepper value={Math.min(qty, max)} onChange={onQty} max={max} label={pdpCopy.quantity} />}
        </div>
        <div className="flex gap-3">
          <Button size="lg" className="flex-1" disabled={!canBuy} onClick={add}>{canBuy ? c.addToBag : c.soldOut}</Button>
          <WishlistButton productId={p.id} name={p.name} variant="outline" className="size-13 shrink-0" />
        </div>
      </div>
      {children}
    </div>
  );
}
