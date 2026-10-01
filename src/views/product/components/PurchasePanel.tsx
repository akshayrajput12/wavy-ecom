"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { BuyBox, MAX_QTY } from "@/components/commerce/BuyBox";
import { addToBag } from "@/components/commerce/addToBag";
import { ImageWell } from "@/components/commerce/ImageWell";
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
  const price = variant?.price ?? p.priceFrom;
  const add = () => { if (variant && canBuy) addToBag(p, variant, Math.min(qty, variant.stock, MAX_QTY)); };

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
      <BuyBox product={p} variant={variant} selection={selection} onSelect={onSelect} qty={qty} onQty={setQty}
        idPrefix="pdp" titleAs="h1" reviewsHref="#reviews" ctaRef={cta} />

      <DeliveryCheck />

      <ul className="grid gap-4 border-y border-line py-5 text-meta sm:grid-cols-2">
        <li className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-pill bg-surface-2" aria-hidden><RotateCcw className="size-4" strokeWidth={1.6} /></span>
          <span><span className="block font-semibold">{c.returns}</span><span className="text-ink-soft">{p.returnable && p.returnWindowDays ? c.returnable(p.returnWindowDays) : c.notReturnable}</span></span>
        </li>
        {p.warranty && (
          <li className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-pill bg-surface-2" aria-hidden><ShieldCheck className="size-4" strokeWidth={1.6} /></span>
            <span><span className="block font-semibold">{c.warranty}</span><span className="text-ink-soft">{p.warranty}</span></span>
          </li>
        )}
      </ul>

      {/* floating mobile add-to-bag pill */}
      <div role="region" aria-label={pdpCopy.addBar} aria-hidden={!barVisible} inert={!barVisible} className={clsx(
        "fixed inset-x-3 bottom-3 z-30 flex items-center gap-3 rounded-pill border border-line bg-surface/90 p-1.5 pl-2 shadow-lg backdrop-blur-md transition-[translate,opacity] duration-(--dur-base) ease-soft lg:hidden",
        barVisible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[calc(100%+1rem)] opacity-0",
      )}>
        <ImageWell media={variant?.image ?? p.images[0]} alt="" sizes="40px" className="size-10 shrink-0 rounded-pill" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-meta font-medium">{p.name}</p>
          <p className="text-meta tabular-nums text-ink-soft">{formatPrice(price)}</p>
        </div>
        <Button disabled={!canBuy} onClick={add}>{canBuy ? c.addToBag : c.soldOut}</Button>
      </div>
    </div>
  );
}
