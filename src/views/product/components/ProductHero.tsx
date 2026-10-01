"use client";

import { useState, type ReactNode } from "react";
import { Gallery } from "@/components/commerce/Gallery";
import { findVariant, initialSelection } from "@/components/commerce/variantSelect";
import type { Product } from "@/types/domain";
import { PurchasePanel } from "./PurchasePanel";

/** Image stack left + sticky info column right; both share the option selection (a variant's image comes into view). */
export function ProductHero({ product, details }: { product: Product; details?: ReactNode }) {
  const [selection, setSelection] = useState(() => initialSelection(product));
  const variant = findVariant(product, selection);
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
      <div className="min-w-0 lg:col-span-7">
        <Gallery images={product.images} name={product.name} focusUrl={variant?.image?.url} stack zoom
          sizes="(min-width: 1024px) 55vw, 100vw" />
      </div>
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <PurchasePanel product={product} variant={variant} selection={selection} onSelect={setSelection} />
          {details}
        </div>
      </div>
    </div>
  );
}
