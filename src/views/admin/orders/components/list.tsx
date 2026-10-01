"use client";

import { clsx } from "clsx";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function Pager({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const path = usePathname();
  const sp = useSearchParams();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => { const n = new URLSearchParams(sp.toString()); n.set("page", String(p)); return `${path}?${n}`; };
  const link = "inline-flex h-11 items-center rounded-pill px-4 text-meta hover:bg-surface-warm sm:h-9";
  return (
    <nav aria-label="Pagination" className="mt-3 flex flex-wrap items-center justify-between gap-3 text-meta text-ink-soft">
      <span aria-live="polite">{total ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}` : "0 results"}</span>
      <span className="flex gap-2">
        {page > 1 ? <Link href={href(page - 1)} className={link}>Previous</Link> : <span className={clsx(link, "opacity-40")}>Previous</span>}
        {page < pages ? <Link href={href(page + 1)} className={link}>Next</Link> : <span className={clsx(link, "opacity-40")}>Next</span>}
      </span>
    </nav>
  );
}

export interface FilterDef { key: string; label: string; options?: { value: string; label: string }[]; type?: "date" }

/** URL-driven filters: Apply pushes ?key=value and resets to page 1. */
export function FilterBar({ filters }: { filters: FilterDef[] }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(filters.map((f) => [f.key, sp.get(f.key) ?? ""])));
  const go = (v: Record<string, string>) => {
    const n = new URLSearchParams();
    const kind = sp.get("kind");
    if (kind) n.set("kind", kind);
    for (const [k, x] of Object.entries(v)) if (x) n.set(k, x);
    router.push(`${path}?${n}`);
  };
  const ctl = "h-11 rounded-sm border border-line bg-surface px-3 text-body focus:border-ink focus:outline-none";
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); go(vals); }} className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-3 sm:p-4">
      {filters.map((f) => (
        <label key={f.key} className="flex min-w-40 flex-1 flex-col gap-1 text-meta font-medium sm:flex-none">
          {f.label}
          {f.options ? (
            <select value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} className={ctl}>
              <option value="">All</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ) : (
            <input type={f.type ?? "search"} value={vals[f.key]} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} className={ctl} />
          )}
        </label>
      ))}
      <Button type="submit" size="sm">Apply</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => { const empty = Object.fromEntries(filters.map((f) => [f.key, ""])); setVals(empty); go(empty); }}>Clear</Button>
    </form>
  );
}

/** Enum values to select options. */
