"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { formatPrice } from "@/lib/format";
import { adminCopy } from "@/data/copy";
import type { AdminOffer } from "@/types/admin";
import { bulkDelete, RemoveButton, useCanRemove } from "../_kit/Remove";
import { COUPON_STATUS } from "@/types/domain";
import { describeOffer } from "./components/describe";

const columns: Column<AdminOffer>[] = [
  { key: "name", header: "Offer", sort: (o) => o.name, cell: (o) => <Link href={`/admin/offers/${o.id}/edit`} className="font-medium hover:underline">{o.name}</Link> },
  { key: "rule", header: "Rule", cell: (o) => <>{describeOffer(o)}{o.badgeText && <span className="t-meta block">Badge: {o.badgeText}</span>}</> },
  { key: "targets", header: "Targets", cell: (o) => (o.targets.length ? `${o.targets.filter((t) => t.mode === "include").length} included, ${o.targets.filter((t) => t.mode === "exclude").length} excluded` : "Everything") },
  { key: "used", header: "Applied", align: "right", sort: (o) => o.stats.applied, cell: (o) => <>{o.stats.applied}<span className="t-meta block">{formatPrice(o.stats.discountGiven)} given</span></> },
  { key: "status", header: "Status", sort: (o) => o.status, cell: (o) => <StatusBadge status={o.status} /> },
  { key: "actions", header: adminCopy.remove.delete, align: "right", cell: (o) => <RemoveButton compact noun="offers" ids={[o.id]} name={o.name} /> },
];

export function OffersView({ offers }: { offers: AdminOffer[] }) {
  const canDelete = useCanRemove("offers");
  return (
    <>
      <PageHeader title="Offers" description="Automatic bundle, buy-X-get-Y and tiered discounts." actions={<ButtonLink href="/admin/offers/new" size="sm">New offer</ButtonLink>} />
      <DataTable caption="Offers" rows={offers} columns={columns} getId={(o) => o.id} search={(o) => `${o.name} ${o.slug}`} searchPlaceholder="Search offers"
        bulkActions={canDelete ? [bulkDelete("offers")] : undefined}
        filters={[{ key: "status", label: "Status", options: COUPON_STATUS.map((s) => ({ value: s, label: s })), match: (o, v) => o.status === v }]}
        empty={{ title: "No offers yet", action: <ButtonLink href="/admin/offers/new" size="sm">Create an offer</ButtonLink> }} />
    </>
  );
}
