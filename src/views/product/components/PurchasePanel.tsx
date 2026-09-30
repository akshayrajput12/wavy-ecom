"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/Controls";
import { OptionPicker, PriceTag, RatingStars, StockNote, WishlistButton } from "@/components/commerce";
import { addToBag } from "@/components/commerce/addToBag";
import { inStock, type Selection } from "@/components/commerce/variantSelect";
import { productCopy as c } from "@/data/copy";
import { pdpCopy } from "@/data/storefront";
import { formatPrice } from "@/lib/format";
import type { Product, ProductVariant } from "@/types/domain";
import { DeliveryCheck } from "./DeliveryCheck";

export function PurchasePanel({ product: p, variant, selection, onSelect }: {
  product: Product; variant?: ProductVariant; selection: Selection; onSelect: (s: Selection) => void;
}) {
  const [qty, setQty] = useState(1);
  const [barVisible, setBarVisible] = useState(false);
  const cta = useRef<HTMLDivElement>(null);
  const canBuy = !!variant && inStock(variant);
  const max = variant ? Math.min(variant.stock, 10) : 1;
  const price = variant?.price ?? p.priceFrom;
  const compareAt = variant ? variant.compareAt : p.compareAtFrom;
  const add = () => { if (variant && canBuy) addToBag(p, variant, Math.min(qty, max)); };

  // Sticky mobile bar appears once the main button scrolls out of view.
  useEffect(() => {
    const el = cta.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setBarVisible(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        {p.brand && <p className="t-overline text-ink-soft">{p.brand}</p>}
        <h1 className="t-h1 mt-2">{p.name}</h1>
        {p.reviewCount > 0 && (
          <a href="#reviews" className="mt-2 inline-flex min-h-11 items-center gap-2 hover:underline hover:underline-offset-4">
            <RatingStars rating={p.rating} size="md" /><span className="text-meta text-ink-soft">{pdpCopy.reviewsLink(p.reviewCount)}</span>
          </a>
        )}
      </div>
      <div>
        <PriceTag price={price} compareAt={compareAt} size="lg" />
        {compareAt && compareAt > price && <p className="mt-1 text-meta font-medium text-accent-deep">{pdpCopy.youSave(formatPrice(compareAt - price))}</p>}
        <p className="mt-1 text-micro text-ink-soft">{c.inclusive}</p>
      </div>
      {p.shortDescription && <p className="text-body-lg text-ink-soft">{p.shortDescription}</p>}

      <OptionPicker product={p} selection={selection} onChange={(s) => { onSelect(s); setQty(1); }} idPrefix="pdp" />
      <StockNote variant={variant} />

      <div ref={cta} className="flex flex-wrap items-center gap-3">
        {canBuy && <QuantityStepper value={Math.min(qty, max)} onChange={setQty} max={max} label={pdpCopy.quantity} />}
        <Button size="lg" className="min-w-48 flex-1" disabled={!canBuy} onClick={add}>{canBuy ? c.addToBag : c.soldOut}</Button>
        <WishlistButton productId={p.id} name={p.name} variant="outline" className="size-13" />
      </div>

      <DeliveryCheck />

      <ul className="grid gap-3 border-y border-line py-5 text-meta sm:grid-cols-2">
        <li className="flex items-start gap-2.5">
          <RotateCcw className="mt-0.5 size-4 shrink-0" strokeWidth={1.6} aria-hidden />
          <span><span className="block font-semibold">{c.returns}</span><span className="text-ink-soft">{p.returnable && p.returnWindowDays ? c.returnable(p.returnWindowDays) : c.notReturnable}</span></span>
        </li>
        {p.warranty && (
          <li className="flex items-start gap-2.5">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" strokeWidth={1.6} aria-hidden />
            <span><span className="block font-semibold">{c.warranty}</span><span className="text-ink-soft">{p.warranty}</span></span>
          </li>
        )}
      </ul>

      <div aria-hidden={!barVisible} className={clsx(
        "fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur-md transition-transform duration-(--dur-base) ease-soft lg:hidden",
        barVisible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-meta font-medium">{p.name}</p>
          <p className="text-meta tabular-nums">{formatPrice(price)}</p>
        </div>
        <Button tabIndex={barVisible ? 0 : -1} disabled={!canBuy} onClick={add}>{canBuy ? c.addToBag : c.soldOut}</Button>
      </div>
    </div>
  );
}
