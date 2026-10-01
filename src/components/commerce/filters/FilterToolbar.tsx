"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Chip, Select } from "@/components/ui/Controls";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { filterCopy, sortOptions } from "@/data/copy";
import { collectionCopy } from "@/data/storefront";
import { formatPrice } from "@/lib/format";
import { FilterPanel, type FilterProps } from "./FilterPanel";
import { useFilterNav } from "./useFilterNav";

/** Toolbar: "Filters" pill (opens the facet drawer), active-filter chips, result count and sort. */
export function FilterToolbar({ total, ...props }: FilterProps & { total: number }) {
  const nav = useFilterNav();
  const sp = nav.params;
  const [sheet, setSheet] = useState(false);

  const categoryName = (slug: string) => props.facets.categories.find((c) => c.slug === slug)?.name ?? slug;
  const min = sp.get("min");
  const max = sp.get("max");
  const cat = props.hideCategories ? null : sp.get("category");
  const active = [
    ...(cat ? [{ key: "category", value: cat, label: categoryName(cat) }] : []),
    ...sp.getAll("brand").map((v) => ({ key: "brand", value: v, label: v })),
    ...sp.getAll("opt").map((v) => ({ key: "opt", value: v, label: v.split(":").slice(1).join(":") || v })),
    ...(min || max ? [{ key: "price", value: "", label: collectionCopy.priceRange(min ? formatPrice(Number(min)) : "", max ? formatPrice(Number(max)) : "") }] : []),
    ...(sp.get("inStock") === "1" ? [{ key: "inStock", value: "1", label: filterCopy.inStock }] : []),
  ];
  const drop = (a: (typeof active)[number]) =>
    a.key === "price" ? nav.set({ min: undefined, max: undefined }) : a.key === "opt" || a.key === "brand" ? nav.remove(a.key, a.value) : nav.set({ [a.key]: undefined });

  return (
    <div className="flex flex-wrap items-center gap-2 border-y border-line py-3">
      <Button variant="secondary" size="sm" className="h-11 px-5" onClick={() => setSheet(true)} aria-haspopup="dialog">
        <SlidersHorizontal className="size-4" aria-hidden /> {filterCopy.filters}
        {active.length > 0 && <span className="grid size-5 place-items-center rounded-pill bg-ink text-micro text-canvas">{active.length}</span>}
      </Button>
      {active.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2 max-md:order-last max-md:w-full" aria-label={collectionCopy.activeFilters}>
          {active.map((a) => (
            <li key={`${a.key}-${a.value}`}>
              <Chip onRemove={() => drop(a)} aria-label={collectionCopy.removeFilter(a.label)}>{a.label}</Chip>
            </li>
          ))}
          <li>
            <button type="button" onClick={nav.clear} className="min-h-11 px-2 text-meta font-medium underline decoration-line underline-offset-4 hover:decoration-ink">{filterCopy.clearAll}</button>
          </li>
        </ul>
      )}
      <div className="ml-auto flex items-center gap-3">
        <p className="t-meta tabular-nums max-sm:sr-only" aria-live="polite">{nav.pending ? collectionCopy.updating : filterCopy.results(total)}</p>
        <Select label={filterCopy.sort} hideLabel value={sp.get("sort") ?? "featured"} onChange={(e) => nav.set({ sort: e.target.value === "featured" ? undefined : e.target.value })}>
          {sortOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </Select>
      </div>

      <Drawer
        open={sheet}
        onClose={() => setSheet(false)}
        title={filterCopy.filters}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={nav.clear} disabled={!active.length}>{filterCopy.clearAll}</Button>
            <Button className="flex-[2]" loading={nav.pending} onClick={() => setSheet(false)}>{filterCopy.apply} ({total})</Button>
          </div>
        }
      >
        <FilterPanel {...props} />
      </Drawer>
    </div>
  );
}
