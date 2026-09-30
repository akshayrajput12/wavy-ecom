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

/** Result count, active-filter chips, clear all, sort, and the mobile filter sheet. */
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

  const sort = (
    <Select label={filterCopy.sort} value={sp.get("sort") ?? "featured"} onChange={(e) => nav.set({ sort: e.target.value === "featured" ? undefined : e.target.value })}>
      {sortOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </Select>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-meta text-ink-soft" aria-live="polite">{nav.pending ? collectionCopy.updating : filterCopy.results(total)}</p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setSheet(true)}>
            <SlidersHorizontal className="size-4" aria-hidden /> {filterCopy.title}{active.length > 0 && ` (${active.length})`}
          </Button>
          <div className="max-lg:hidden">{sort}</div>
        </div>
      </div>
      {active.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2" aria-label={collectionCopy.activeFilters}>
          {active.map((a) => (
            <li key={`${a.key}-${a.value}`}>
              <Chip onRemove={() => drop(a)} aria-label={collectionCopy.removeFilter(a.label)}>{a.label}</Chip>
            </li>
          ))}
          <li>
            <button type="button" onClick={nav.clear} className="min-h-11 px-2 text-meta font-medium underline underline-offset-4 hover:text-accent-deep">{filterCopy.clearAll}</button>
          </li>
        </ul>
      )}

      <Drawer
        open={sheet}
        onClose={() => setSheet(false)}
        side="bottom"
        title={filterCopy.title}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={nav.clear} disabled={!active.length}>{filterCopy.clearAll}</Button>
            <Button className="flex-[2]" loading={nav.pending} onClick={() => setSheet(false)}>{filterCopy.apply} ({total})</Button>
          </div>
        }
      >
        <div className="mb-2 [&_select]:w-full">{sort}</div>
        <FilterPanel {...props} />
      </Drawer>
    </div>
  );
}
