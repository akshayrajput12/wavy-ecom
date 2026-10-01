"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { formatPrice } from "@/lib/format";
import { adminCopy } from "@/data/copy";
import type { AdminCampaign } from "@/types/admin";
import { bulkDelete, RemoveButton, useCanRemove } from "../_kit/Remove";
import { CAMPAIGN_STATUS } from "@/types/domain";
import { fmtDateTime } from "../orders/components/fmt";

const columns: Column<AdminCampaign>[] = [
  { key: "name", header: "Campaign", sort: (c) => c.name, cell: (c) => <Link href={`/admin/campaigns/${c.id}/edit`} className="font-medium hover:underline">{c.name}</Link> },
  { key: "channel", header: "Channel", cell: (c) => c.channel.replace(/_/g, " ") },
  { key: "window", header: "Runs", cell: (c) => (c.startsAt || c.endsAt ? `${fmtDateTime(c.startsAt)} to ${fmtDateTime(c.endsAt)}` : "Not scheduled") },
  { key: "budget", header: "Budget", align: "right", sort: (c) => c.budgetPaise ?? 0, cell: (c) => (c.budgetPaise != null ? formatPrice(c.budgetPaise) : "-") },
  { key: "status", header: "Status", sort: (c) => c.status, cell: (c) => <StatusBadge status={c.status} /> },
  { key: "actions", header: adminCopy.remove.delete, align: "right", cell: (c) => <RemoveButton compact noun="campaigns" ids={[c.id]} name={c.name} /> },
];

export function CampaignsView({ campaigns }: { campaigns: AdminCampaign[] }) {
  const canDelete = useCanRemove("campaigns");
  return (
    <>
      <PageHeader title="Campaigns" description="Promotions across channels, linked to a coupon or offer." actions={<ButtonLink href="/admin/campaigns/new" size="sm">New campaign</ButtonLink>} />
      <DataTable caption="Campaigns" rows={campaigns} columns={columns} getId={(c) => c.id} search={(c) => `${c.name} ${c.slug} ${c.channel}`} searchPlaceholder="Search campaigns"
        bulkActions={canDelete ? [bulkDelete("campaigns")] : undefined}
        filters={[{ key: "status", label: "Status", options: CAMPAIGN_STATUS.map((s) => ({ value: s, label: s })), match: (c, v) => c.status === v }]}
        empty={{ title: "No campaigns yet", action: <ButtonLink href="/admin/campaigns/new" size="sm">Create a campaign</ButtonLink> }} />
    </>
  );
}
