"use client";

import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import type { AuditEntry } from "@/data/admin/types";

const columns: Column<AuditEntry>[] = [
  { key: "at", header: "Time", sort: (e) => e.at, cell: (e) => <span className="whitespace-nowrap">{formatDateTime(e.at)}</span> },
  { key: "actor", header: "Actor", sort: (e) => e.actor, cell: (e) => e.actor },
  { key: "action", header: "Action", sort: (e) => e.action, cell: (e) => <code className="rounded-sm bg-surface-warm px-1.5 py-0.5 text-meta">{e.action}</code> },
  { key: "entity", header: "Entity", sort: (e) => e.entity, cell: (e) => <><span className="capitalize">{e.entity}</span> <span className="t-meta">{e.entityId}</span></> },
  { key: "detail", header: "Detail", cell: (e) => <span className="t-meta">{e.detail}</span> },
];

/** Read-only, append-only record of high-impact admin actions (NFR-007). */
export function AuditLogView({ entries }: { entries: AuditEntry[] }) {
  const opts = (xs: string[]) => [...new Set(xs)].map((v) => ({ value: v, label: v }));
  return (
    <>
      <PageHeader title="Audit log" description="Every high-impact change with who did it and when. Entries can't be edited or deleted." />
      <DataTable caption="Audit log entries" rows={entries} columns={columns} getId={(e) => e.id} pageSize={20}
        search={(e) => `${e.actor} ${e.action} ${e.entityId} ${e.detail}`} searchPlaceholder="Search actor, action or entity id"
        filters={[
          { key: "actor", label: "Actor", options: opts(entries.map((e) => e.actor)), match: (e, v) => e.actor === v },
          { key: "entity", label: "Entity", options: opts(entries.map((e) => e.entity)), match: (e, v) => e.entity === v },
        ]}
        empty={{ title: "No activity recorded yet" }} />
    </>
  );
}
