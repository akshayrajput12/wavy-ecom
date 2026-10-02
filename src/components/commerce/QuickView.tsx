"use client";

import dynamic from "next/dynamic";
import { create } from "zustand";
import { clsx } from "clsx";
import { ShoppingBagIcon } from "@/components/ui/icons";
import { quickViewCopy } from "@/data/storefront";
import type { Product } from "@/types/domain";

// ponytail: one global dialog fed by a tiny store, instead of a <dialog> per product card.
const useQuickView = create<{ product: Product | null; open: boolean }>(() => ({ product: null, open: false }));
export const openQuickView = (product: Product) => useQuickView.setState({ product, open: true });
const closeQuickView = () => useQuickView.setState({ open: false });

// Dialog + Gallery + BuyBox load on first open (prefetched on hover/focus of a trigger), not with every store page.
const loadPanel = () => import("./QuickViewPanel");
const QuickViewPanel = dynamic(() => loadPanel().then((m) => m.QuickViewPanel), { ssr: false });

/** Card trigger: black circular quick-add button (44px hit area around a 36px disc). */
export function QuickViewButton({ product, className }: { product: Product; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => openQuickView(product)}
      onPointerEnter={loadPanel}
      onFocus={loadPanel}
      aria-label={quickViewCopy.open(product.name)}
      className={clsx("group/qv grid size-11 place-items-center rounded-pill", className)}
    >
      <span className="grid size-9 place-items-center rounded-pill bg-ink text-canvas shadow-sm transition-transform duration-(--dur-base) ease-soft group-hover/qv:scale-110 group-active/qv:scale-95" aria-hidden>
        <ShoppingBagIcon className="size-4" strokeWidth={1.8} />
      </span>
    </button>
  );
}

/** Mounted once in the store layout. Renders nothing until the first quick view is opened. */
export function QuickViewHost() {
  const { product, open } = useQuickView();
  return product ? <QuickViewPanel product={product} open={open} onClose={closeQuickView} /> : null;
}
