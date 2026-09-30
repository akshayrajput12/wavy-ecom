import Link from "next/link";
import { PageHeader } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import { Button, buttonClass } from "@/components/ui/Button";
import type { AdminAuditEntry, Paginated } from "@/types/admin";

export type AuditFilters = { entityType?: string; entityId?: string; action?: string; from?: string; to?: string };
const FIELDS = [["entityType", "Entity type"], ["entityId", "Entity id"], ["action", "Action prefix"]] as const;
const input = "h-11 rounded-sm border border-line bg-surface px-3 text-body focus:border-ink focus:outline-none";

function href(f: AuditFilters, page: number) {
  const q = new URLSearchParams(Object.entries({ ...f, page: String(page) }).filter(([, v]) => v) as [string, string][]);
  return `/admin/audit-log?${q}`;
}

export function AuditLogView({ data, filters }: { data: Paginated<AdminAuditEntry>; filters: AuditFilters }) {
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return (
    <>
      <PageHeader title="Audit log" description="Every admin write, with who did it and what changed." />
      <form method="get" className="mb-4 flex flex-wrap items-end gap-3" aria-label="Filter audit log">
        {FIELDS.map(([k, label]) => (
          <label key={k} className="grid gap-1.5 text-meta font-medium">{label}<input name={k} defaultValue={filters[k] ?? ""} className={input} /></label>
        ))}
        <label className="grid gap-1.5 text-meta font-medium">From<input type="date" name="from" defaultValue={filters.from?.slice(0, 10) ?? ""} className={input} /></label>
        <label className="grid gap-1.5 text-meta font-medium">To<input type="date" name="to" defaultValue={filters.to?.slice(0, 10) ?? ""} className={input} /></label>
        <Button type="submit">Apply</Button>
        <Link href="/admin/audit-log" className={buttonClass({ variant: "ghost" })}>Clear</Link>
      </form>
      <div className="overflow-x-auto rounded-md border border-line bg-surface">
        <table className="w-full min-w-[720px] text-body">
          <caption className="sr-only">Audit log entries</caption>
          <thead className="bg-canvas text-left text-meta text-ink-soft"><tr>
            {["When", "Actor", "Action", "Entity", "Changes"].map((h) => <th key={h} scope="col" className="px-4 py-2.5 font-medium">{h}</th>)}
          </tr></thead>
          <tbody>
            {data.items.map((e) => (
              <tr key={e.id} className="border-t border-line-soft align-top">
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(e.createdAt)}</td>
                <td className="px-4 py-3">{e.actorEmail ?? "System"}<span className="block text-meta text-ink-soft">{e.actorRole}</span></td>
                <td className="px-4 py-3 font-medium">{e.action}</td>
                <td className="px-4 py-3">{e.entityType}<span className="block text-meta break-all text-ink-soft">{e.entityId}</span></td>
                <td className="px-4 py-3">
                  <details>
                    <summary className="min-h-6 cursor-pointer text-meta underline">{e.changedFields?.length ? e.changedFields.join(", ") : "View"}</summary>
                    <pre className="mt-2 max-h-64 max-w-md overflow-auto rounded-sm bg-surface-warm p-2 text-micro">{JSON.stringify({ before: e.before, after: e.after }, null, 2)}</pre>
                  </details>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.items.length === 0 && <p className="p-6 text-center text-body text-ink-soft">No entries match these filters.</p>}
      </div>
      <nav className="mt-4 flex items-center justify-between text-meta text-ink-soft" aria-label="Pagination">
        <span>Page {data.page} of {pages} ({data.total} entries)</span>
        <span className="flex gap-2">
          {data.page > 1 && <Link className={buttonClass({ variant: "ghost", size: "sm" })} href={href(filters, data.page - 1)}>Previous</Link>}
          {data.page < pages && <Link className={buttonClass({ variant: "ghost", size: "sm" })} href={href(filters, data.page + 1)}>Next</Link>}
        </span>
      </nav>
    </>
  );
}
