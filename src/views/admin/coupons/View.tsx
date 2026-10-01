"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { formatPrice } from "@/lib/format";
import { adminCopy } from "@/data/copy";
import type { AdminCoupon } from "@/types/admin";
import { bulkDelete, RemoveButton, useCanRemove } from "../_kit/Remove";
import { COUPON_STATUS } from "@/types/domain";
import { mutate } from "../api";
import { fmtDateTime } from "../orders/components/fmt";

export const couponValue = (c: Pick<AdminCoupon, "type" | "value">) =>
  c.type === "percent" ? `${c.value}% off` : c.type === "fixed" ? `${formatPrice(c.value)} off` : "Free shipping";

export function CouponsView({ coupons }: { coupons: AdminCoupon[] }) {
  const router = useRouter();
  const canDelete = useCanRemove("coupons");
  const bulk = (status: (typeof COUPON_STATUS)[number]) => async (ids: string[]) => {
    const res = await mutate("POST", "coupons/bulk-status", { ids, status }, { success: `${ids.length} coupon(s) set to ${status}` });
    if (res.ok) router.refresh();
  };
  const columns: Column<AdminCoupon>[] = [
    { key: "code", header: "Code", sort: (c) => c.code, cell: (c) => <Link href={`/admin/coupons/${c.code}/edit`} className="font-medium hover:underline">{c.code}</Link> },
    { key: "value", header: "Discount", cell: (c) => <>{couponValue(c)}{c.minOrderAmount > 0 && <span className="t-meta block">min {formatPrice(c.minOrderAmount)}</span>}</> },
    { key: "targets", header: "Targets", cell: (c) => (c.targets.length ? `${c.targets.filter((t) => t.mode === "include").length} included, ${c.targets.filter((t) => t.mode === "exclude").length} excluded` : "Everything") },
    { key: "used", header: "Used", align: "right", sort: (c) => c.stats.applied, cell: (c) => <>{c.stats.applied}{c.usageLimitTotal ? ` / ${c.usageLimitTotal}` : ""}<span className="t-meta block">{formatPrice(c.stats.discountGiven)} given</span></> },
    { key: "window", header: "Valid", cell: (c) => (c.startsAt || c.endsAt ? `${c.startsAt ? fmtDateTime(c.startsAt) : "any time"} to ${c.endsAt ? fmtDateTime(c.endsAt) : "no end"}` : "Always") },
    { key: "status", header: "Status", sort: (c) => c.status, cell: (c) => <StatusBadge status={c.status} /> },
    { key: "actions", header: adminCopy.remove.delete, align: "right", cell: (c) => <RemoveButton compact noun="coupons" ids={[c.id]} name={c.code} /> },
  ];
  return (
    <>
      <PageHeader title="Coupons" description="Codes customers enter at checkout." actions={<ButtonLink href="/admin/coupons/new" size="sm">New coupon</ButtonLink>} />
      <DataTable caption="Coupons" rows={coupons} columns={columns} getId={(c) => c.id}
        search={(c) => `${c.code} ${c.description ?? ""}`} searchPlaceholder="Search code"
        filters={[{ key: "status", label: "Status", options: COUPON_STATUS.map((s) => ({ value: s, label: s })), match: (c, v) => c.status === v }]}
        bulkActions={[{ label: "Activate", onClick: (ids) => void bulk("active")(ids) }, { label: "Pause", onClick: (ids) => void bulk("paused")(ids) }, { label: "Archive", danger: true, onClick: (ids) => void bulk("archived")(ids) }, ...(canDelete ? [bulkDelete("coupons")] : [])]}
        empty={{ title: "No coupons yet", action: <ButtonLink href="/admin/coupons/new" size="sm">Create a coupon</ButtonLink> }} />
    </>
  );
}
