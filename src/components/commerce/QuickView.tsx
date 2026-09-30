"use client";

import Link from "next/link";
import { useState } from "react";
import { create } from "zustand";
import { clsx } from "clsx";
import { ArrowRight, Eye } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/Controls";
import { productCopy } from "@/data/copy";
import { pdpCopy, quickViewCopy } from "@/data/storefront";
import type { Product } from "@/types/domain";
import { addToBag } from "./addToBag";
import { ImageWell } from "./ImageWell";
import { OptionPicker } from "./OptionPicker";
import { PriceTag } from "./PriceTag";
import { RatingStars } from "./RatingStars";
import { StockNote } from "./StockNote";
import { findVariant, initialSelection } from "./variantSelect";

// ponytail: one global dialog fed by a tiny store, instead of a <dialog> per product card.
const useQuickView = create<{ product: Product | null; open: boolean }>(() => ({ product: null, open: false }));
export const openQuickView = (product: Product) => useQuickView.setState({ product, open: true });

/** Card trigger: floating pill on desktop hover, always-visible icon button on touch. */
export function QuickViewButton({ product, className }: { product: Product; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openQuickView(product)}
      aria-label={quickViewCopy.open(product.name)}
      className={clsx(
        "inline-flex size-11 items-center justify-center gap-2 rounded-pill bg-surface/90 text-meta font-medium text-ink shadow-sm backdrop-blur-sm transition-[opacity,translate,background-color] duration-(--dur-base) hover:bg-surface",
        "md:h-10 md:w-auto md:px-4",
        className,
      )}
    >
      <Eye className="size-4" aria-hidden />
      <span className="max-md:sr-only" aria-hidden>{quickViewCopy.label}</span>
    </button>
  );
}

/** Mounted once in the store layout. */
export function QuickViewHost() {
  const { product, open } = useQuickView();
  const close = () => useQuickView.setState({ open: false });
  return (
    <Modal open={open && !!product} onClose={close} title={quickViewCopy.label} size="lg">
      {product && <QuickViewBody key={product.id} product={product} onDone={close} />}
    </Modal>
  );
}

function QuickViewBody({ product: p, onDone }: { product: Product; onDone: () => void }) {
  const [selection, setSelection] = useState(() => initialSelection(p));
  const [shown, setShown] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const variant = findVariant(p, selection);
  const image = shown !== null ? p.images[shown] : (variant?.image ?? p.images[0]);
  const canBuy = !!variant && variant.stock > 0 && variant.status === "active";

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <ImageWell media={image} sizes="(min-width: 640px) 380px, 90vw" className="aspect-square rounded-md" />
        {p.images.length > 1 && (
          <ul className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none]">
            {p.images.slice(0, 6).map((m, i) => (
              <li key={m.url + i}>
                <button type="button" onClick={() => setShown(i)} aria-label={pdpCopy.showImage(i + 1)} aria-pressed={image === m}
                  className={clsx("block size-14 overflow-hidden rounded-sm border-2 transition-colors", image === m ? "border-ink" : "border-transparent hover:border-line")}>
                  <ImageWell media={m} alt="" sizes="56px" className="size-full" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <div>
          {p.brand && <p className="t-overline text-ink-soft">{p.brand}</p>}
          <h3 className="t-h2 mt-1">{p.name}</h3>
          {p.reviewCount > 0 && <RatingStars rating={p.rating} count={p.reviewCount} className="mt-2" />}
        </div>
        <PriceTag price={variant?.price ?? p.priceFrom} compareAt={variant ? variant.compareAt : p.compareAtFrom} size="lg" />
        {p.shortDescription && <p className="line-clamp-3 text-body text-ink-soft">{p.shortDescription}</p>}
        <OptionPicker product={p} selection={selection} onChange={(s) => { setSelection(s); setShown(null); }} idPrefix={`qv-${p.id}`} />
        <StockNote variant={variant} />
        <div className="flex items-center gap-3">
          {canBuy && <QuantityStepper value={qty} onChange={setQty} max={Math.min(variant.stock, 10)} label={pdpCopy.quantity} />}
          <Button className="flex-1" disabled={!canBuy} onClick={() => { if (variant) { addToBag(p, variant, qty); onDone(); } }}>
            {canBuy ? productCopy.addToBag : productCopy.soldOut}
          </Button>
        </div>
        <Link href={`/products/${p.slug}`} onClick={onDone} className="group inline-flex min-h-11 items-center gap-2 self-start text-body font-medium text-accent-deep">
          {quickViewCopy.viewDetails}
          <ArrowRight className="size-4 transition-transform duration-(--dur-fast) group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
