import type { ReactNode } from "react";

/** Chart wrapper with a "view as table" fallback so data is never chart-only (a11y). */
export function ChartCard({ title, description, actions, children, table }: {
  title: string; description?: string; actions?: ReactNode; children: ReactNode;
  table?: { headers: string[]; rows: (string | number)[][] };
}) {
  return (
    <figure className="min-w-0 rounded-lg border border-line bg-surface p-4 sm:p-5">
      <figcaption className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body-lg font-semibold">{title}</p>
          {description && <p className="t-meta mt-0.5">{description}</p>}
        </div>
        {actions}
      </figcaption>
      {children}
      {table && (
        <details className="mt-3">
          <summary className="cursor-pointer text-meta text-ink-soft hover:text-ink">View as table</summary>
          <div className="mt-2 max-h-64 overflow-auto">
            <table className="w-full text-meta">
              <caption className="sr-only">{title}</caption>
              <thead><tr>{table.headers.map((h) => <th key={h} scope="col" className="py-1 pr-3 text-left font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i} className="border-t border-line-soft">{r.map((c, j) => <td key={j} className="py-1 pr-3 tabular-nums">{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </figure>
  );
}
