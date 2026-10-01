"use client";

import { clsx } from "clsx";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { adminCopy } from "@/data/copy";

const c = adminCopy.table;

export interface Column<T> {
  key: string; header: string; cell: (row: T) => ReactNode;
  sort?: (row: T) => string | number; align?: "right"; className?: string;
}
export interface FilterDef<T> { key: string; label: string; options: { value: string; label: string }[]; match: (row: T, value: string) => boolean }
export interface BulkAction { label: string; onClick: (ids: string[]) => void; danger?: boolean }

interface Props<T> {
  caption: string; rows: T[]; columns: Column<T>[]; getId: (row: T) => string;
  search?: (row: T) => string; searchPlaceholder?: string;
  filters?: FilterDef<T>[]; initialFilters?: Record<string, string>;
  bulkActions?: BulkAction[]; pageSize?: number; loading?: boolean;
  empty?: { title: string; body?: string; action?: ReactNode }; toolbar?: ReactNode;
}

/** Admin list table: search, filter chips, sort, pagination, row selection + bulk actions, loading/empty states. */
export function DataTable<T>({
  caption, rows, columns, getId, search, searchPlaceholder = c.search, filters = [], initialFilters = {},
  bulkActions, pageSize = 10, loading, empty, toolbar,
}: Props<T>) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Record<string, string>>(initialFilters);
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((r) =>
      (!needle || !search || search(r).toLowerCase().includes(needle)) &&
      filters.every((f) => !active[f.key] || f.match(r, active[f.key])),
    );
    const col = sort && columns.find((c) => c.key === sort.key);
    if (col?.sort && sort) {
      const get = col.sort;
      out = [...out].sort((a, b) => (get(a) > get(b) ? 1 : get(a) < get(b) ? -1 : 0) * sort.dir);
    }
    return out;
  }, [rows, q, active, sort, columns, filters, search]);

  const pages = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, pages - 1);
  const pageRows = visible.slice(current * pageSize, (current + 1) * pageSize);
  const pageIds = pageRows.map(getId);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const selectable = !!bulkActions?.length;
  const filtered = !!q || Object.values(active).some(Boolean);

  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const togglePage = () => setSelected((s) => { const n = new Set(s); pageIds.forEach((id) => (allOnPage ? n.delete(id) : n.add(id))); return n; });
  const setFilter = (key: string, value: string) => { setActive((a) => ({ ...a, [key]: value })); setPage(0); };
  const clear = () => { setQ(""); setActive({}); setPage(0); };

  if (!loading && rows.length === 0 && empty) return <EmptyState {...empty} />;

  return (
    <div className="min-w-0 rounded-lg border border-line bg-surface">
      <div className="flex flex-col gap-3 border-b border-line p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          {search && (
            <label className="relative w-full sm:w-auto sm:min-w-52 sm:flex-1">
              <span className="sr-only">{searchPlaceholder}</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
              <input
                type="search" value={q} placeholder={searchPlaceholder}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
                className="h-11 w-full rounded-pill border border-line bg-surface pr-4 pl-9 text-body focus:border-ink focus:outline-none"
              />
            </label>
          )}
          {toolbar}
        </div>
        {filters.map((f) => (
          <div key={f.key} role="group" aria-label={c.filterBy(f.label)} className="flex flex-wrap items-center gap-1.5">
            <span className="t-meta mr-1">{f.label}</span>
            {[{ value: "", label: c.all }, ...f.options].map((o) => {
              const on = (active[f.key] ?? "") === o.value;
              return (
                <button
                  key={o.value} type="button" aria-pressed={on} onClick={() => setFilter(f.key, o.value)}
                  className={clsx("h-11 rounded-pill border px-3 text-meta transition-colors sm:h-9", on ? "border-ink bg-ink text-on-dark" : "border-line hover:border-ink")}
                >{o.label}</button>
              );
            })}
          </div>
        ))}
      </div>

      {selectable && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-surface-warm px-4 py-2" role="region" aria-label={c.bulkActions}>
          <span className="text-meta font-medium">{c.selected(selected.size)}</span>
          {bulkActions!.map((a) => (
            <Button key={a.label} size="sm" variant={a.danger ? "secondary" : "primary"} className={clsx(a.danger && "border-danger text-danger hover:bg-danger")}
              onClick={() => { a.onClick([...selected]); setSelected(new Set()); }}>{a.label}</Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>{c.clear}</Button>
        </div>
      )}

      <div className="relative overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[640px] text-body">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-canvas text-left">
            <tr>
              {selectable && (
                <th scope="col" className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label={c.selectPage} className="size-4 accent-ink" />
                </th>
              )}
              {columns.map((c) => {
                const dir = sort?.key === c.key ? sort.dir : 0;
                return (
                  <th key={c.key} scope="col" aria-sort={dir === 1 ? "ascending" : dir === -1 ? "descending" : undefined}
                    className={clsx("px-4 py-2.5 text-meta font-medium whitespace-nowrap text-ink-soft", c.align === "right" && "text-right")}>
                    {c.sort ? (
                      <button type="button" className="inline-flex items-center gap-1 hover:text-ink"
                        onClick={() => setSort(dir === 1 ? { key: c.key, dir: -1 } : dir === -1 ? null : { key: c.key, dir: 1 })}>
                        {c.header}
                        {dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : dir === -1 ? <ArrowDown className="size-3" aria-hidden /> : <ArrowUpDown className="size-3 opacity-50" aria-hidden />}
                      </button>
                    ) : c.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 5 }, (_, i) => (
              <tr key={i} className="border-t border-line-soft">
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
              </tr>
            )) : pageRows.map((row) => {
              const id = getId(row);
              return (
                <tr key={id} className={clsx("border-t border-line-soft hover:bg-canvas", selected.has(id) && "bg-surface-warm/60")}>
                  {selectable && (
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.has(id)} onChange={() => toggle(id)} aria-label={c.selectRow(id)} className="size-4 accent-ink" /></td>
                  )}
                  {columns.map((c) => <td key={c.key} className={clsx("px-4 py-3 align-middle", c.align === "right" && "text-right tabular-nums", c.className)}>{c.cell(row)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
        {!loading && visible.length === 0 && (
          <div className="p-6">
            <EmptyState title={filtered ? c.noMatches : (empty?.title ?? c.emptyTitle)} body={filtered ? c.noMatchesBody : empty?.body}
              action={filtered ? <Button size="sm" variant="secondary" onClick={clear}>{c.clearFilters}</Button> : empty?.action} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line px-4 py-3 text-meta text-ink-soft">
        <span aria-live="polite">
          {visible.length ? c.range(current * pageSize + 1, Math.min((current + 1) * pageSize, visible.length), visible.length) : c.noResults}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" disabled={current === 0} onClick={() => setPage(current - 1)}>{c.previous}</Button>
          <Button size="sm" variant="ghost" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>{c.next}</Button>
        </div>
      </div>
    </div>
  );
}
