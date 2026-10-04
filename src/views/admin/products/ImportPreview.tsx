import type { ImportIssue, ImportSummary } from "@/backend/catalog-import/columns";
import { catalogImportCopy as c } from "@/data/copy";

const ENTITIES = ["categories", "collections", "products", "variants"] as const;

/** Rows the import will write (new + updated, plus collection links). */
export const changeCount = (s: ImportSummary) =>
  ENTITIES.reduce((n, k) => n + s.counts[k].new + s.counts[k].updated, 0) + s.counts.memberships;

function Issues({ title, items, total, tone }: { title: string; items: ImportIssue[]; total: number; tone: "danger" | "soft" }) {
  return (
    <section aria-label={title} className="grid gap-2">
      <h3 className={tone === "danger" ? "text-body font-semibold text-danger" : "text-body font-semibold"} role={tone === "danger" ? "alert" : undefined}>{title}</h3>
      {total > items.length && <p className="t-meta">{c.more(items.length, total)}</p>}
      <div className="max-h-72 overflow-auto overscroll-contain rounded-md border border-line">
        <table className="w-full min-w-[34rem] text-left text-meta">
          <thead className="sticky top-0 border-b border-line bg-surface text-ink-soft">
            <tr>{[c.sheet, c.row, c.column, c.problem].map((h) => <th key={h} scope="col" className="p-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {items.map((i, n) => (
              <tr key={`${i.sheet}-${i.row}-${i.column}-${n}`} className="border-b border-line-soft last:border-0 align-top">
                <td className="p-2 whitespace-nowrap">{i.sheet}</td>
                <td className="p-2 tabular-nums">{i.row}</td>
                <td className="p-2 whitespace-nowrap">{i.column || c.wholeRow}</td>
                <td className="p-2 break-words">{i.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Dry-run result: what the import would change, then every problem with its sheet, row and column. */
export function ImportPreview({ summary }: { summary: ImportSummary }) {
  const changes = changeCount(summary);
  return (
    <div className="grid gap-5">
      <section aria-label={c.summary} className="grid gap-2">
        <h3 className="text-body font-semibold">{c.summary}</h3>
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[26rem] text-left text-body">
            <thead className="border-b border-line text-meta text-ink-soft">
              <tr>{[c.item, c.new, c.updated, c.unchanged].map((h) => <th key={h} scope="col" className="p-2 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {ENTITIES.map((k) => (
                <tr key={k} className="border-b border-line-soft last:border-0">
                  <th scope="row" className="p-2 font-medium">{c.entities[k]}</th>
                  <td className="p-2 tabular-nums">{summary.counts[k].new}</td>
                  <td className="p-2 tabular-nums">{summary.counts[k].updated}</td>
                  <td className="p-2 tabular-nums text-ink-soft">{summary.counts[k].unchanged}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {summary.counts.memberships > 0 && <p className="t-meta">{c.memberships(summary.counts.memberships)}</p>}
        {!summary.errorCount && <p className="text-meta text-success">{changes ? c.ready : c.nothing}</p>}
      </section>
      {summary.errorCount > 0 && <Issues title={c.errors(summary.errorCount)} items={summary.errors} total={summary.errorCount} tone="danger" />}
      {summary.warnings.length > 0 && <Issues title={c.warnings(summary.warnings.length)} items={summary.warnings} total={summary.warnings.length} tone="soft" />}
    </div>
  );
}
