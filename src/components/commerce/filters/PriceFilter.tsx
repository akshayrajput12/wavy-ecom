"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { filterCopy } from "@/data/copy";
import { collectionCopy } from "@/data/storefront";
import { formatPrice } from "@/lib/format";

const toRupees = (paise: string | null) => (paise ? String(Math.round(Number(paise) / 100)) : "");
const toPaise = (rupees: string) => (rupees.trim() && Number(rupees) >= 0 ? String(Math.round(Number(rupees) * 100)) : undefined);

/** Min/max in rupees; the URL carries paise (ProductQuery min/max). */
export function PriceFilter({ bounds, min, max, onApply }: {
  bounds: { min: number; max: number }; min: string | null; max: string | null; onApply: (min?: string, max?: string) => void;
}) {
  const [lo, setLo] = useState(toRupees(min));
  const [hi, setHi] = useState(toRupees(max));
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onApply(toPaise(lo), toPaise(hi));
  };
  const field = "h-11 w-full rounded-sm border border-line bg-surface px-3 text-body tabular-nums focus:border-ink focus:outline-none";
  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-meta text-ink-soft">{collectionCopy.priceRange(formatPrice(bounds.min), formatPrice(bounds.max))}</p>
      <div className="flex items-end gap-2">
        <label className="flex-1 text-meta font-medium">
          {filterCopy.minPrice}
          <input type="number" inputMode="numeric" min={0} value={lo} onChange={(e) => setLo(e.target.value)} placeholder={toRupees(String(bounds.min))} className={`${field} mt-1`} />
        </label>
        <label className="flex-1 text-meta font-medium">
          {filterCopy.maxPrice}
          <input type="number" inputMode="numeric" min={0} value={hi} onChange={(e) => setHi(e.target.value)} placeholder={toRupees(String(bounds.max))} className={`${field} mt-1`} />
        </label>
        <Button type="submit" variant="secondary" size="sm" className="h-11">{collectionCopy.priceApply}</Button>
      </div>
    </form>
  );
}
