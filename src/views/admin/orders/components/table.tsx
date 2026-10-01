import { clsx } from "clsx";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/States";

/** Server-safe (no "use client"): server views pass `cell`/`getId` functions here, which a client component can't receive. */
export interface Col<T> { header: string; cell: (row: T) => ReactNode; right?: boolean }

/** Plain table for server-paginated data. */
export function SimpleTable<T>({ caption, rows, cols, getId, empty }: {
  caption: string; rows: T[]; cols: Col<T>[]; getId: (r: T) => string; empty: string;
}) {
  if (!rows.length) return <EmptyState title={empty} />;
  return (
    <div className="relative min-w-0 overflow-x-auto overscroll-x-contain rounded-lg border border-line bg-surface">
      <table className="w-full min-w-[640px] text-body">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-canvas text-left">
          <tr>{cols.map((c) => <th key={c.header} scope="col" className={clsx("px-4 py-2.5 text-meta font-medium whitespace-nowrap text-ink-soft", c.right && "text-right")}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={getId(r)} className="border-t border-line-soft align-top hover:bg-canvas">
              {cols.map((c) => <td key={c.header} className={clsx("px-4 py-3", c.right && "text-right tabular-nums")}>{c.cell(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const opts = (values: readonly string[]) => values.map((v) => ({ value: v, label: v.replace(/_/g, " ") }));
