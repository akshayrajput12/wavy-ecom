"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import type { AdminContentPage } from "@/types/admin";

const cols: Column<AdminContentPage>[] = [
  { key: "title", header: "Title", sort: (p) => p.title, cell: (p) => <Link href={`/admin/pages/${p.id}/edit`} className="font-medium underline-offset-4 hover:underline">{p.title}</Link> },
  { key: "slug", header: "Slug", cell: (p) => `/${p.slug}` },
  { key: "type", header: "Type", sort: (p) => p.pageType, cell: (p) => p.pageType },
  { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
  { key: "updated", header: "Updated", sort: (p) => p.updatedAt, cell: (p) => formatDateTime(p.updatedAt) },
];

export function PagesView({ pages }: { pages: AdminContentPage[] }) {
  return (
    <>
      <PageHeader title="Pages" description="About, policies and other content pages." actions={<ButtonLink href="/admin/pages/new">New page</ButtonLink>} />
      <DataTable caption="Content pages" rows={pages} columns={cols} getId={(p) => p.id} search={(p) => `${p.title} ${p.slug}`} searchPlaceholder="Search pages"
        empty={{ title: "No pages yet", action: <ButtonLink href="/admin/pages/new" size="sm">Create a page</ButtonLink> }} />
    </>
  );
}
