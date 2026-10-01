"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { adminCopy } from "@/data/copy";
import type { AdminCollection } from "@/types/admin";
import { bulkDelete, RemoveButton, useCanRemove } from "../_kit/Remove";

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : null);

const columns: Column<AdminCollection>[] = [
  { key: "image", header: "Image", cell: (c) => (
    <div className="relative size-12 overflow-hidden rounded-sm bg-surface-warm">
      {c.imageUrl && <Image src={c.imageUrl} alt={c.imageAlt ?? c.name} fill sizes="48px" className="object-cover" />}
    </div>
  ) },
  { key: "name", header: "Collection", sort: (c) => c.name, cell: (c) => (
    <div><Link href={`/admin/collections/${c.slug}/edit`} className="font-medium underline-offset-4 hover:underline">{c.name}</Link><p className="t-meta">/{c.slug}</p></div>
  ) },
  { key: "products", header: "Products", align: "right", sort: (c) => c.productCount, cell: (c) => c.productCount },
  { key: "home", header: "Home", cell: (c) => (c.showOnHome ? <Badge tone="info">On home</Badge> : <span className="text-ink-soft">No</span>) },
  { key: "schedule", header: "Schedule", cell: (c) => (c.startsAt || c.endsAt
    ? <span className="text-meta">{day(c.startsAt) ?? "Any time"} to {day(c.endsAt) ?? "no end"}</span>
    : <span className="text-meta text-ink-soft">Always</span>) },
  { key: "active", header: "Status", cell: (c) => <Badge tone={c.isActive ? "success" : "neutral"} dot>{c.isActive ? "Active" : "Inactive"}</Badge> },
  { key: "actions", header: adminCopy.remove.delete, align: "right", cell: (c) => <RemoveButton compact noun="collections" ids={[c.id]} name={c.name} /> },
];

export function CollectionsView({ collections }: { collections: AdminCollection[] }) {
  const canDelete = useCanRemove("collections");
  return (
    <>
      <PageHeader title="Collections" description="Curated product groups for the storefront and home page." actions={<ButtonLink href="/admin/collections/new" size="sm">New collection</ButtonLink>} />
      <DataTable
        caption="Collections" rows={collections} columns={columns} getId={(c) => c.id} search={(c) => `${c.name} ${c.slug}`} searchPlaceholder="Search collections"
        bulkActions={canDelete ? [bulkDelete("collections")] : undefined}
        empty={{ title: "No collections yet", action: <ButtonLink href="/admin/collections/new" size="sm">Create one</ButtonLink> }}
      />
    </>
  );
}
