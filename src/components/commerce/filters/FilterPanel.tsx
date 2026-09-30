"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import { Accordion, Chip } from "@/components/ui/Controls";
import { filterCopy } from "@/data/copy";
import type { Facets } from "@/backend/catalog/facets";
import { PriceFilter } from "./PriceFilter";
import { useFilterNav } from "./useFilterNav";

export interface FilterProps {
  facets: Facets;
  /** Category pages navigate subcategories with chips instead. */
  hideCategories?: boolean;
}

/** Facet filters: category, brand, every option axis (swatches for colours), price, availability. */
export function FilterPanel({ facets, hideCategories }: FilterProps) {
  const nav = useFilterNav();
  const { params: sp } = nav;
  const opts = sp.getAll("opt");
  const brands = sp.getAll("brand");

  return (
    <div aria-busy={nav.pending} className={clsx("transition-opacity duration-(--dur-base)", nav.pending && "opacity-60")}>
      {!hideCategories && facets.categories.length > 1 && (
        <Accordion title={filterCopy.category} defaultOpen>
          <div className="flex flex-wrap gap-2">
            {facets.categories.map((c) => {
              const on = sp.get("category") === c.slug;
              return (
                <Chip key={c.id} active={on} onClick={() => nav.set({ category: on ? undefined : c.slug })}>
                  {c.name} <span className="opacity-60">{c.count}</span>
                </Chip>
              );
            })}
          </div>
        </Accordion>
      )}

      {facets.brands.length > 1 && (
        <Accordion title={filterCopy.brand} defaultOpen>
          <ul className="space-y-0.5">
            {facets.brands.map((b) => (
              <li key={b.value}>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-1 text-body hover:bg-surface-warm">
                  <input type="checkbox" checked={brands.includes(b.value)} onChange={() => nav.toggle("brand", b.value)} className="size-4.5 accent-ink" />
                  <span className="flex-1">{b.value}</span>
                  <span className="text-meta text-ink-soft">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </Accordion>
      )}

      {facets.options.map((axis) => {
        const swatch = axis.values.some((v) => v.colorHex);
        return (
          <Accordion key={axis.name} title={axis.name} defaultOpen>
            <div className={swatch ? "grid grid-cols-2 gap-1" : "flex flex-wrap gap-2"}>
              {axis.values.map((v) => {
                const key = `${axis.name}:${v.value}`;
                const on = opts.includes(key);
                return swatch ? (
                  <button key={v.value} type="button" aria-pressed={on} onClick={() => nav.toggle("opt", key)}
                    className="flex min-h-11 items-center gap-2.5 rounded-sm px-1 text-left text-meta hover:bg-surface-warm">
                    <span className={clsx("grid size-6 shrink-0 place-items-center rounded-pill border", on ? "border-ink ring-2 ring-ink ring-offset-2 ring-offset-canvas" : "border-ink/15")} style={{ backgroundColor: v.colorHex }}>
                      {on && <Check className="size-3 text-on-dark mix-blend-difference" aria-hidden />}
                    </span>
                    <span className={clsx("flex-1", on && "font-semibold")}>{v.value}</span>
                    <span className="text-ink-soft">{v.count}</span>
                  </button>
                ) : (
                  <Chip key={v.value} active={on} onClick={() => nav.toggle("opt", key)}>{v.value}</Chip>
                );
              })}
            </div>
          </Accordion>
        );
      })}

      {facets.price && facets.price.max > facets.price.min && (
        <Accordion title={filterCopy.price} defaultOpen>
          <PriceFilter bounds={facets.price} min={sp.get("min")} max={sp.get("max")} onApply={(min, max) => nav.set({ min, max })} />
        </Accordion>
      )}

      <Accordion title={filterCopy.availability} defaultOpen>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-body">
          {filterCopy.inStock}
          <input type="checkbox" checked={sp.get("inStock") === "1"} onChange={(e) => nav.set({ inStock: e.target.checked ? "1" : undefined })} className="size-5 accent-ink" />
        </label>
      </Accordion>
    </div>
  );
}
