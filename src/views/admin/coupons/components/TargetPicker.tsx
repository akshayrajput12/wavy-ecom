"use client";

import { useMemo, useState } from "react";
import { Chip } from "@/components/ui/Controls";
import type { AdminProduct, DiscountTarget } from "@/types/admin";
import { adminApi } from "../../api";

export interface TargetOptions {
  products: { id: string; name: string; slug: string }[];
  categories: { id: string; name: string; depth: number }[];
  collections: { id: string; name: string }[];
}
type Kind = DiscountTarget["kind"];
type Item = { id: string; label: string };

const KINDS: { value: Kind; label: string }[] = [
  { value: "product", label: "Product" }, { value: "variant", label: "Variant" }, { value: "category", label: "Category" }, { value: "collection", label: "Collection" },
];
const ctl = "h-10 rounded-sm border border-line bg-surface px-3 text-body focus:border-ink focus:outline-none";

/** Include/exclude targeting: no include rows = applies to everything; exclude always wins; a category covers its descendants. */
export function TargetPicker({ value, onChange, options }: { value: DiscountTarget[]; onChange: (v: DiscountTarget[]) => void; options: TargetOptions }) {
  const [kind, setKind] = useState<Kind>("product");
  const [mode, setMode] = useState<DiscountTarget["mode"]>("include");
  const [q, setQ] = useState("");
  const [parent, setParent] = useState<{ name: string; variants: Item[] } | null>(null);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const source = useMemo<Item[]>(() => {
    if (kind === "variant") return parent?.variants ?? options.products.map((p) => ({ id: p.slug, label: p.name }));
    if (kind === "product") return options.products.map((p) => ({ id: p.id, label: p.name }));
    if (kind === "category") return options.categories.map((c) => ({ id: c.id, label: `${"- ".repeat(c.depth)}${c.name}` }));
    return options.collections.map((c) => ({ id: c.id, label: c.name }));
  }, [kind, parent, options]);
  const results = source.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);

  const labelOf = (t: DiscountTarget) => {
    const list = t.kind === "product" ? options.products : t.kind === "category" ? options.categories : t.kind === "collection" ? options.collections : [];
    return labels[`${t.kind}:${t.id}`] ?? list.find((x) => x.id === t.id)?.name ?? `${t.kind} ${t.id.slice(0, 8)}`;
  };
  const add = (id: string, label: string) => {
    if (value.some((t) => t.kind === kind && t.id === id)) return;
    setLabels({ ...labels, [`${kind}:${id}`]: label });
    onChange([...value, { mode, kind, id }]);
  };
  const pick = async (i: Item) => {
    if (kind !== "variant" || parent) return add(i.id, i.label);
    setLoading(true);
    const res = await adminApi<AdminProduct>("GET", `products/${i.id}`);
    setLoading(false);
    if (res.ok) { setParent({ name: i.label, variants: res.data.variants.map((v) => ({ id: v.id, label: `${i.label} / ${v.title || v.sku}` })) }); setQ(""); }
  };

  return (
    <div className="flex flex-col gap-4">
      {(["include", "exclude"] as const).map((m) => {
        const rows = value.filter((t) => t.mode === m);
        return (
          <div key={m}>
            <p className="text-meta font-medium">{m === "include" ? "Applies only to" : "Never applies to"}{m === "include" && rows.length === 0 ? " (nothing chosen = everything)" : ""}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {rows.length === 0 && <span className="t-meta">None</span>}
              {rows.map((t) => <Chip key={`${t.kind}${t.id}`} active onRemove={() => onChange(value.filter((x) => x !== t))}>{t.kind}: {labelOf(t)}</Chip>)}
            </div>
          </div>
        );
      })}
      <div className="flex flex-col gap-2 rounded-md border border-line p-3">
        <div className="flex flex-wrap gap-2">
          <select aria-label="Target mode" value={mode} onChange={(e) => setMode(e.target.value as DiscountTarget["mode"])} className={ctl}><option value="include">Include</option><option value="exclude">Exclude</option></select>
          <select aria-label="Target type" value={kind} onChange={(e) => { setKind(e.target.value as Kind); setParent(null); setQ(""); }} className={ctl}>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <input type="search" aria-label={`Search ${kind}`} placeholder={kind === "variant" && !parent ? "Search a product to list its variants" : `Search ${kind}`} value={q} onChange={(e) => setQ(e.target.value)} className={`${ctl} min-w-56 flex-1`} />
        </div>
        {parent && <p className="t-meta">Variants of {parent.name} <button type="button" className="underline" onClick={() => { setParent(null); setQ(""); }}>choose another product</button></p>}
        <ul className="flex flex-wrap gap-1.5" aria-live="polite">
          {loading && <li className="t-meta">Loading variants...</li>}
          {results.map((i) => <li key={i.id}><button type="button" onClick={() => void pick(i)} className="min-h-9 rounded-pill border border-line px-3 text-meta hover:border-ink">+ {i.label}</button></li>)}
          {!loading && results.length === 0 && <li className="t-meta">No matches</li>}
        </ul>
      </div>
    </div>
  );
}
