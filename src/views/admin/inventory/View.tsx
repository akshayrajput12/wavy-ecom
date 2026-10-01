"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { Select } from "@/components/admin/Fields";
import { PageHeader } from "@/components/admin/Panel";
import type { AdminInventoryRow, Paginated } from "@/types/admin";
import { adminApi } from "../api";
import { InventoryRow } from "./InventoryRow";

const FILTERS = ["all", "low", "out"] as const;
type Filter = (typeof FILTERS)[number];

export function InventoryView({ initialFilter }: { initialFilter?: string }) {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<Filter>(FILTERS.find((f) => f === initialFilter) ?? "all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paginated<AdminInventoryRow> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    adminApi<Paginated<AdminInventoryRow>>("GET", `inventory?${new URLSearchParams({ q: term, filter, page: String(page) })}`).then((res) => {
      if (!alive) return;
      if (res.ok) { setData(res.data ?? null); setError(null); } else setError(res.error);
    });
    return () => { alive = false; };
  }, [term, filter, page, tick]);
  const load = () => setTick((t) => t + 1);

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  return (
    <>
      <PageHeader title="Inventory" description="Stock per variant. Every change is written to the movement ledger." />
      <form className="mb-4 grid gap-3 sm:flex sm:flex-wrap sm:items-end" onSubmit={(e) => { e.preventDefault(); setPage(1); setTerm(q.trim()); }}>
        <Input label="Search SKU or product" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select label="Show" value={filter} onChange={(e) => { setFilter(e.target.value as Filter); setPage(1); }}>
          <option value="all">All variants</option><option value="low">Low stock</option><option value="out">Out of stock</option>
        </Select>
        <Button type="submit" size="sm" variant="ghost">Search</Button>
      </form>
      {error && <p role="alert" className="mb-3 text-danger">⚠ {error}</p>}
      {!data ? <Skeleton className="h-64 w-full" /> : data.items.length === 0 ? <EmptyState title="No variants match" /> : (
        <div className="relative overflow-x-auto overscroll-x-contain rounded-lg border border-line bg-surface">
          <table className="w-full min-w-3xl text-left text-body">
            <caption className="sr-only">Inventory by variant</caption>
            <thead className="border-b border-line text-meta text-ink-soft">
              <tr><th className="p-3">Product / variant</th><th className="p-3">SKU</th><th className="p-3 text-right">On hand</th><th className="p-3 text-right">Reserved</th><th className="p-3 text-right">Available</th><th className="p-3">Stock</th><th className="p-3"><span className="sr-only">Details</span></th></tr>
            </thead>
            <tbody>{data.items.map((r) => <InventoryRow key={r.variantId} row={r} onChanged={load} />)}</tbody>
          </table>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-meta text-ink-soft">
        <span>{data ? `${data.total} variants` : ""}</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {page} of {pages}</span>
          <Button size="sm" variant="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      </div>
    </>
  );
}
