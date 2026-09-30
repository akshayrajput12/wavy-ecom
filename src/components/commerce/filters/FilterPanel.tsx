"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Accordion, Chip } from "@/components/ui/Controls";
import { filterCopy } from "@/data/content";
import type { Facets, ProductFilters } from "@/backend/catalog/repo";
import { FILTER_KEYS, withParam, type FilterKey } from "./params";

/** Pushes filter changes into the URL (server re-renders the grid). */
export function useFilterNav(params: Record<string, string>) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const go = (qs: string) => start(() => router.push(`${pathname}${qs === "?" ? "" : qs}`, { scroll: false }));
  return {
    pending,
    set: (key: FilterKey | "sort", values: string[]) => go(withParam(params, key, values)),
    clear: () => {
      const kept = Object.fromEntries(Object.entries(params).filter(([k]) => !(FILTER_KEYS as readonly string[]).includes(k)));
      go(withParam(kept, "_", []));
    },
  };
}

export interface FilterProps {
  facets: Facets;
  selected: ProductFilters;
  params: Record<string, string>;
  isFootwear?: boolean;
}

const toggle = (arr: string[] = [], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export function FilterPanel({ facets, selected, params, isFootwear }: FilterProps) {
  const { set, pending } = useFilterNav(params);
  return (
    <div aria-busy={pending} className={clsx("transition-opacity", pending && "opacity-60")}>
      {facets.categories.length > 1 && (
        <Accordion title={isFootwear ? filterCopy.silhouette : filterCopy.category} defaultOpen>
          <div className="flex flex-wrap gap-2">
            {facets.categories.map((c) => (
              <Chip key={c.slug} active={selected.categories?.includes(c.slug)} onClick={() => set("category", toggle(selected.categories, c.slug))}>
                {c.name} <span className="opacity-60">{c.count}</span>
              </Chip>
            ))}
          </div>
        </Accordion>
      )}
      <Accordion title={filterCopy.size} defaultOpen>
        <div className={clsx("grid gap-2", isFootwear ? "grid-cols-3" : "grid-cols-5")}>
          {facets.sizes.map((s) => {
            const on = selected.sizes?.includes(s);
            return (
              <button key={s} type="button" aria-pressed={on} onClick={() => set("size", toggle(selected.sizes, s))}
                className={clsx("h-11 rounded-sm border text-meta font-medium transition-colors", on ? "border-ink bg-ink text-on-dark" : "border-line bg-surface hover:border-ink")}>
                {s}
              </button>
            );
          })}
        </div>
      </Accordion>
      <Accordion title={filterCopy.color} defaultOpen>
        <ul className="grid grid-cols-2 gap-1">
          {facets.colors.map((c) => {
            const on = selected.colors?.includes(c.name);
            return (
              <li key={c.name}>
                <button type="button" aria-pressed={on} onClick={() => set("color", toggle(selected.colors, c.name))}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-sm px-1 text-left text-meta hover:bg-surface-warm">
                  <span className={clsx("grid size-6 shrink-0 place-items-center rounded-full border", on ? "border-ink ring-2 ring-ink ring-offset-2 ring-offset-canvas" : "border-ink/15")} style={{ backgroundColor: c.hex }}>
                    {on && <Check className="size-3 text-on-dark mix-blend-difference" aria-hidden />}
                  </span>
                  <span className={clsx(on && "font-semibold")}>{c.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Accordion>
      <Accordion title={filterCopy.price} defaultOpen>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={filterCopy.price}>
          {facets.priceBands.map((b) => (
            <Chip key={b.id} role="radio" aria-checked={selected.price === b.id} active={selected.price === b.id} onClick={() => set("price", selected.price === b.id ? [] : [b.id])}>
              {b.label}
            </Chip>
          ))}
        </div>
      </Accordion>
      {facets.materials.length > 1 && (
        <Accordion title={filterCopy.material}>
          <div className="flex flex-wrap gap-2">
            {facets.materials.map((m) => (
              <Chip key={m} active={selected.materials?.includes(m)} onClick={() => set("material", toggle(selected.materials, m))}>{m}</Chip>
            ))}
          </div>
        </Accordion>
      )}
      <Accordion title={filterCopy.availability} defaultOpen>
        <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-body">
          {filterCopy.inStock}
          <input type="checkbox" checked={!!selected.inStock} onChange={(e) => set("stock", e.target.checked ? ["1"] : [])} className="size-5 accent-ink" />
        </label>
      </Accordion>
    </div>
  );
}
