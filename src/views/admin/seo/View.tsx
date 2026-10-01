"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { adminCopy } from "@/data/copy";
import type { AdminRedirect, AdminSeoOverride } from "@/types/admin";
import { bulkDelete, RemoveButton, useCanRemove } from "../_kit/Remove";

const overrideCols: Column<AdminSeoOverride>[] = [
  { key: "path", header: "Path", sort: (o) => o.path, cell: (o) => <Link href={`/admin/seo/overrides/${o.id}/edit`} className="font-medium underline-offset-4 hover:underline">{o.path}</Link> },
  { key: "title", header: "Title", cell: (o) => o.title ?? "Default" },
  { key: "index", header: "Indexing", cell: (o) => <Badge tone={o.noindex ? "warning" : "success"} dot>{o.noindex ? "noindex" : "Indexed"}</Badge> },
  { key: "actions", header: adminCopy.remove.delete, align: "right", cell: (o) => <RemoveButton compact noun="seo-overrides" ids={[o.id]} name={o.path} /> },
];
const redirectCols: Column<AdminRedirect>[] = [
  { key: "from", header: "From", sort: (r) => r.fromPath, cell: (r) => <Link href={`/admin/seo/redirects/${r.id}/edit`} className="font-medium underline-offset-4 hover:underline">{r.fromPath}</Link> },
  { key: "to", header: "To", cell: (r) => r.toPath },
  { key: "code", header: "Code", cell: (r) => r.statusCode },
  { key: "hits", header: "Hits", sort: (r) => r.hitCount, cell: (r) => r.hitCount },
  { key: "active", header: "Status", cell: (r) => <Badge tone={r.isActive ? "success" : "neutral"} dot>{r.isActive ? "Active" : "Off"}</Badge> },
  { key: "actions", header: adminCopy.remove.delete, align: "right", cell: (r) => <RemoveButton compact noun="redirects" ids={[r.id]} name={r.fromPath} /> },
];

export function SeoView({ overrides, redirects }: { overrides: AdminSeoOverride[]; redirects: AdminRedirect[] }) {
  const canDelete = useCanRemove("redirects");
  return (
    <>
      <PageHeader title="SEO" description="Per-path metadata overrides and redirects." />
      <section className="mb-10" aria-labelledby="ov">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 id="ov" className="t-h3">Metadata overrides</h2><ButtonLink size="sm" href="/admin/seo/overrides/new">New override</ButtonLink></div>
        <DataTable caption="SEO overrides" rows={overrides} columns={overrideCols} getId={(o) => o.id} search={(o) => `${o.path} ${o.title ?? ""}`} searchPlaceholder="Search paths"
          bulkActions={canDelete ? [bulkDelete("seo-overrides")] : undefined}
          empty={{ title: "No overrides", body: "Pages use their default metadata." }} />
      </section>
      <section aria-labelledby="rd">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><h2 id="rd" className="t-h3">Redirects</h2><ButtonLink size="sm" href="/admin/seo/redirects/new">New redirect</ButtonLink></div>
        <DataTable caption="Redirects" rows={redirects} columns={redirectCols} getId={(r) => r.id} search={(r) => `${r.fromPath} ${r.toPath}`} searchPlaceholder="Search redirects"
          bulkActions={canDelete ? [bulkDelete("redirects")] : undefined}
          empty={{ title: "No redirects" }} />
      </section>
    </>
  );
}
