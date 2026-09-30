"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import type { Coupon } from "@/data/admin/types";
import { formatDate, formatPrice } from "@/lib/format";
import { COUPON_STATUS, type CouponStatus } from "@/types/domain";
import { mutate } from "../api";
import { CouponDialog } from "./components/CouponDialog";

export const couponValue = (c: Pick<Coupon, "type" | "value">) =>
  c.type === "percent" ? `${c.value}% off` : c.type === "flat" ? `${formatPrice(c.value)} off` : "Free shipping";

export function CouponsView({ coupons }: { coupons: Coupon[] }) {
  const [rows, setRows] = useState(coupons);
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);

  const setStatus = (ids: string[], status: CouponStatus) => {
    const before = rows;
    setRows(rows.map((c) => (ids.includes(c.id) ? { ...c, status } : c)));
    void mutate("coupons/bulk-status", { ids, status }, { success: `${ids.length} coupon(s) ${status}`, rollback: () => setRows(before) });
  };
  const save = (c: Coupon) => {
    const before = rows;
    const exists = rows.some((x) => x.id === c.id);
    setRows(exists ? rows.map((x) => (x.id === c.id ? c : x)) : [c, ...rows]);
    setEditing(null);
    // TODO(backend agent): call /api/admin/coupons (server enforces unique code + eligibility at checkout)
    void mutate("coupons", c, { success: exists ? `${c.code} updated` : `${c.code} created`, rollback: () => setRows(before) });
  };

  const columns: Column<Coupon>[] = [
    { key: "code", header: "Code", sort: (c) => c.code, cell: (c) => <button type="button" onClick={() => setEditing(c)} className="font-mono font-medium hover:underline">{c.code}</button> },
    { key: "value", header: "Discount", cell: (c) => <>{couponValue(c)}{c.minOrder > 0 && <span className="t-meta block">Min {formatPrice(c.minOrder)}</span>}</> },
    { key: "usage", header: "Usage", sort: (c) => c.usage, cell: (c) => (
      <span className="block min-w-28">
        <span className="t-meta">{c.usage}{c.usageLimit ? ` / ${c.usageLimit}` : " uses"}</span>
        {c.usageLimit && <span className="mt-1 block h-1.5 rounded-pill bg-line-soft"><span className="block h-full rounded-pill bg-ink" style={{ width: `${Math.min(100, (c.usage / c.usageLimit) * 100)}%` }} /></span>}
      </span>
    ) },
    { key: "valid", header: "Valid", sort: (c) => c.startsAt, cell: (c) => <span className="t-meta">{formatDate(c.startsAt)} – {formatDate(c.endsAt)}</span> },
    { key: "restriction", header: "Restrictions", cell: (c) => <span className="t-meta">{c.restriction}</span> },
    { key: "status", header: "Status", sort: (c) => c.status, cell: (c) => <StatusBadge status={c.status} /> },
  ];

  return (
    <>
      <PageHeader title="Coupons" description="Codes customers enter at checkout. Bundle and BOGO deals live in Offers."
        actions={<Button size="sm" onClick={() => setEditing("new")}>New coupon</Button>} />
      <DataTable
        caption="Coupons" rows={rows} columns={columns} getId={(c) => c.id} search={(c) => `${c.code} ${c.restriction}`} searchPlaceholder="Search code"
        filters={[{ key: "status", label: "Status", options: COUPON_STATUS.map((s) => ({ value: s, label: s })), match: (c, v) => c.status === v }]}
        bulkActions={[{ label: "Activate", onClick: (ids) => setStatus(ids, "active") }, { label: "Pause", onClick: (ids) => setStatus(ids, "paused") }, { label: "Archive", danger: true, onClick: (ids) => setStatus(ids, "archived") }]}
        empty={{ title: "No coupons yet", action: <Button size="sm" onClick={() => setEditing("new")}>Create a coupon</Button> }}
      />
      <CouponDialog value={editing} onClose={() => setEditing(null)} onSave={save} />
    </>
  );
}
