"use client";

import { useState } from "react";
import { findVariant, initialSelection } from "@/components/commerce/variantSelect";
import type { Product } from "@/types/domain";
import { Gallery } from "./Gallery";
import { PurchasePanel } from "./PurchasePanel";

/** Gallery + buy box share the option selection (a variant's own image comes into view). */
export function ProductHero({ product }: { product: Product }) {
  const [selection, setSelection] = useState(() => initialSelection(product));
  const variant = findVariant(product, selection);
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-7">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <Gallery images={product.images} name={product.name} focusUrl={variant?.image?.url} />
        </div>
      </div>
      <div className="lg:col-span-5">
        <PurchasePanel product={product} variant={variant} selection={selection} onSelect={setSelection} />
      </div>
    </div>
  );
}
