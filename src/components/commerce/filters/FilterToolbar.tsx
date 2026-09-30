"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Chip, Select } from "@/components/ui/Controls";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { filterCopy, sortOptions } from "@/data/content";
import { FilterPanel, useFilterNav, type FilterProps } from "./FilterPanel";
import type { FilterKey } from "./params";

/** Result count, active-filter chips, clear all, sort, and the mobile filter sheet (screen 26). */
export function FilterToolbar({ count, ...props }: FilterProps & { count: number }) {
  const { facets, selected: s, params } = props;
  const { set, clear, pending } = useFilterNav(params);
  const [sheet, setSheet] = useState(false);

  const nameOf = (slug: string) => facets.categories.find((c) => c.slug === slug)?.name ?? slug;
  const active: { key: FilterKey; value: string; label: string; rest: string[] }[] = [
    ...(s.categories ?? []).map((v) => ({ key: "category" as const, value: v, label: nameOf(v), rest: s.categories ?? [] })),
    ...(s.sizes ?? []).map((v) => ({ key: "size" as const, value: v, label: v, rest: s.sizes ?? [] })),
    ...(s.colors ?? []).map((v) => ({ key: "color" as const, value: v, label: v, rest: s.colors ?? [] })),
    ...(s.materials ?? []).map((v) => ({ key: "material" as const, value: v, label: v, rest: s.materials ?? [] })),
    ...(s.price ? [{ key: "price" as const, value: s.price, label: facets.priceBands.find((b) => b.id === s.price)?.label ?? s.price, rest: [s.price] }] : []),
    ...(s.inStock ? [{ key: "stock" as const, value: "1", label: filterCopy.inStock, rest: ["1"] }] : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-meta text-ink-soft" aria-live="polite">{pending ? "Updating…" : filterCopy.results(count)}</p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setSheet(true)}>
            <SlidersHorizontal className="size-4" aria-hidden /> {filterCopy.title}{active.length > 0 && ` (${active.length})`}
          </Button>
          <Select label={filterCopy.sort} hideLabel className="max-lg:hidden" value={s.sort ?? "featured"} onChange={(e) => set("sort", e.target.value === "featured" ? [] : [e.target.value])}>
            {sortOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        </div>
      </div>
      {active.length > 0 && (
        <ul className="flex flex-wrap items-center gap-2" aria-label="Active filters">
          {active.map((a) => (
            <li key={`${a.key}-${a.value}`}>
              <Chip onRemove={() => set(a.key, a.rest.filter((x) => x !== a.value))} aria-label={`Remove filter ${a.label}`}>{a.label}</Chip>
            </li>
          ))}
          <li><button type="button" onClick={clear} className="min-h-9 px-2 text-meta font-medium underline underline-offset-4 hover:text-accent-deep">{filterCopy.clearAll}</button></li>
        </ul>
      )}

      <Drawer
        open={sheet}
        onClose={() => setSheet(false)}
        side="bottom"
        title={filterCopy.title}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={clear} disabled={!active.length}>{filterCopy.clearAll}</Button>
            <Button className="flex-[2]" loading={pending} onClick={() => setSheet(false)}>{filterCopy.apply} ({count})</Button>
          </div>
        }
      >
        <Select label={filterCopy.sort} className="mb-2 justify-between" value={s.sort ?? "featured"} onChange={(e) => set("sort", e.target.value === "featured" ? [] : [e.target.value])}>
          {sortOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </Select>
        <FilterPanel {...props} />
      </Drawer>
    </div>
  );
}
