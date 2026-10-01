"use client";

import { clsx } from "clsx";
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

const count = (n: number) => <span className="tabular-nums opacity-60">{n}</span>;

/** Facet filters as pill chips: category, brand, every option axis (colour dot when known), price, availability. */
export function FilterPanel({ facets, hideCategories }: FilterProps) {
  const nav = useFilterNav();
  const { params: sp } = nav;
  const opts = sp.getAll("opt");
  const brands = sp.getAll("brand");
  const chips = "flex flex-wrap gap-2";

  return (
    <div aria-busy={nav.pending} className={clsx("border-t border-line transition-opacity duration-(--dur-base)", nav.pending && "opacity-60")}>
      {!hideCategories && facets.categories.length > 1 && (
        <Accordion title={filterCopy.category} defaultOpen>
          <div className={chips}>
            {facets.categories.map((c) => {
              const on = sp.get("category") === c.slug;
              return <Chip key={c.id} active={on} onClick={() => nav.set({ category: on ? undefined : c.slug })}>{c.name} {count(c.count)}</Chip>;
            })}
          </div>
        </Accordion>
      )}

      {facets.brands.length > 1 && (
        <Accordion title={filterCopy.brand} defaultOpen>
          <div className={chips}>
            {facets.brands.map((b) => (
              <Chip key={b.value} active={brands.includes(b.value)} onClick={() => nav.toggle("brand", b.value)}>{b.value} {count(b.count)}</Chip>
            ))}
          </div>
        </Accordion>
      )}

      {facets.options.map((axis) => (
        <Accordion key={axis.name} title={axis.name} defaultOpen>
          <div className={chips}>
            {axis.values.map((v) => {
              const key = `${axis.name}:${v.value}`;
              return (
                <Chip key={v.value} active={opts.includes(key)} onClick={() => nav.toggle("opt", key)}>
                  {v.colorHex && <span className="size-3.5 rounded-pill border border-ink/15" style={{ backgroundColor: v.colorHex }} aria-hidden />}
                  {v.value}
                </Chip>
              );
            })}
          </div>
        </Accordion>
      ))}

      {facets.price && facets.price.max > facets.price.min && (
        <Accordion title={filterCopy.price} defaultOpen>
          <PriceFilter bounds={facets.price} min={sp.get("min")} max={sp.get("max")} onApply={(min, max) => nav.set({ min, max })} />
        </Accordion>
      )}

      <Accordion title={filterCopy.availability} defaultOpen>
        <Chip active={sp.get("inStock") === "1"} onClick={() => nav.set({ inStock: sp.get("inStock") === "1" ? undefined : "1" })}>{filterCopy.inStock}</Chip>
      </Accordion>
    </div>
  );
}
