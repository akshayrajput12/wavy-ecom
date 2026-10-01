"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ChevronRight } from "lucide-react";
import { quickViewCopy } from "@/data/storefront";
import type { Product } from "@/types/domain";
import { BuyBox } from "./BuyBox";
import { Gallery } from "./Gallery";
import { QuickViewDialog } from "./QuickViewDialog";
import { findVariant, initialSelection } from "./variantSelect";

/** Dialog + body. Lazy-loaded by QuickViewHost (QuickView.tsx) on first open, so pages don't ship it upfront. */
export function QuickViewPanel({ product, open, onClose }: { product: Product; open: boolean; onClose: () => void }) {
  const titleId = useId();
  return (
    <QuickViewDialog open={open} onClose={onClose} labelledBy={titleId}>
      <QuickViewBody key={product.id} product={product} titleId={titleId} onClose={onClose} />
    </QuickViewDialog>
  );
}

function QuickViewBody({ product: p, titleId, onClose }: { product: Product; titleId: string; onClose: () => void }) {
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
          idPrefix={`qv-${p.id}`} titleId={titleId} onAdded={onClose}>
          <Link href={`/products/${p.slug}`} onClick={onClose}
            className="group inline-flex min-h-11 items-center gap-1 text-meta font-medium text-ink underline underline-offset-4 decoration-line hover:decoration-ink">
            {quickViewCopy.viewDetails}
            <ChevronRight className="size-4 transition-transform duration-(--dur-fast) group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </BuyBox>
      </div>
    </div>
  );
}
