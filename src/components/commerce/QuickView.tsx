"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { create } from "zustand";
import { clsx } from "clsx";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { quickViewCopy } from "@/data/storefront";
import type { Product } from "@/types/domain";
import { BuyBox } from "./BuyBox";
import { Gallery } from "./Gallery";
import { QuickViewDialog } from "./QuickViewDialog";
import { findVariant, initialSelection } from "./variantSelect";

// ponytail: one global dialog fed by a tiny store, instead of a <dialog> per product card.
const useQuickView = create<{ product: Product | null; open: boolean }>(() => ({ product: null, open: false }));
export const openQuickView = (product: Product) => useQuickView.setState({ product, open: true });
const closeQuickView = () => useQuickView.setState({ open: false });

/** Card trigger: black circular quick-add button (44px hit area around a 36px disc). */
export function QuickViewButton({ product, className }: { product: Product; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openQuickView(product)}
      aria-label={quickViewCopy.open(product.name)}
      className={clsx("group/qv grid size-11 place-items-center rounded-pill", className)}
    >
      <span className="grid size-9 place-items-center rounded-pill bg-ink text-canvas shadow-sm transition-transform duration-(--dur-base) ease-soft group-hover/qv:scale-110 group-active/qv:scale-95" aria-hidden>
        <ShoppingBag className="size-4" strokeWidth={1.8} />
      </span>
    </button>
  );
}

/** Mounted once in the store layout. */
export function QuickViewHost() {
  const { product, open } = useQuickView();
  const titleId = useId();
  return (
    <QuickViewDialog open={open && !!product} onClose={closeQuickView} labelledBy={titleId}>
      {product && <QuickViewBody key={product.id} product={product} titleId={titleId} />}
    </QuickViewDialog>
  );
}

function QuickViewBody({ product: p, titleId }: { product: Product; titleId: string }) {
  const [selection, setSelection] = useState(() => initialSelection(p));
  const [qty, setQty] = useState(1);
  const variant = findVariant(p, selection);

  return (
    <div className="md:grid md:h-full md:min-h-0 md:grid-cols-[1.08fr_1fr]">
      <div className="p-3 md:overflow-y-auto md:p-4" data-lenis-prevent>
        <Gallery images={p.images} name={p.name} focusUrl={variant?.image?.url} aspect="aspect-square" sizes="(min-width: 768px) 520px, 100vw" />
      </div>
      <div className="px-5 pb-8 pt-4 md:overflow-y-auto md:px-10 md:pb-10 md:pt-14" data-lenis-prevent>
        <BuyBox product={p} variant={variant} selection={selection} onSelect={setSelection} qty={qty} onQty={setQty}
          idPrefix={`qv-${p.id}`} titleId={titleId} onAdded={closeQuickView}>
          <Link href={`/products/${p.slug}`} onClick={closeQuickView}
            className="group inline-flex min-h-11 items-center gap-1 text-meta font-medium text-ink underline underline-offset-4 decoration-line hover:decoration-ink">
            {quickViewCopy.viewDetails}
            <ChevronRight className="size-4 transition-transform duration-(--dur-fast) group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </BuyBox>
      </div>
    </div>
  );
}
