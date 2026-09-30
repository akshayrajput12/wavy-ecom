"use client";

import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import type { AdminIntegration } from "@/types/admin";

const cols: Column<AdminIntegration>[] = [
  { key: "provider", header: "Integration", sort: (i) => i.provider, cell: (i) => <span className="font-medium">{i.provider}</span> },
  { key: "env", header: "Environment", cell: (i) => i.environment },
  { key: "status", header: "Status", cell: (i) => <StatusBadge status={i.status} /> },
  { key: "active", header: "Enabled", cell: (i) => <Badge tone={i.isActive ? "success" : "neutral"} dot>{i.isActive ? "On" : "Off"}</Badge> },
  { key: "checked", header: "Last checked", cell: (i) => (i.lastCheckedAt ? formatDateTime(i.lastCheckedAt) : "Never") },
  { key: "edit", header: "", align: "right", cell: (i) => <ButtonLink size="sm" variant="secondary" href={`/admin/integrations/${i.id}/edit`}>Edit</ButtonLink> },
];

export function IntegrationsView({ items }: { items: AdminIntegration[] }) {
  return (
    <>
      <PageHeader title="Integrations" description="Third-party services. Secrets live in environment variables, never here." />
      <DataTable caption="Integrations" rows={items} columns={cols} getId={(i) => i.id} search={(i) => i.provider} searchPlaceholder="Search integrations" empty={{ title: "No integrations configured" }} />
    </>
  );
}
