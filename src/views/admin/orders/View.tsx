"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import { useCan } from "@/components/admin/useRole";
import type { AdminOrder } from "@/data/admin/types";
import { formatDate, formatPrice } from "@/lib/format";
import { mutate } from "../api";

const STATUS_FILTER = [
  { value: "to_fulfil", label: "To fulfil" }, { value: "pending_payment", label: "Pending payment" },
  { value: "shipped", label: "In transit" }, { value: "delivered", label: "Delivered" },
  { value: "returns", label: "Returns & refunds" }, { value: "cancelled", label: "Cancelled" },
];
const matchStatus = (o: AdminOrder, v: string) =>
  v === "to_fulfil" ? ["paid", "processing", "packed"].includes(o.status)
  : v === "returns" ? ["return_requested", "returned", "refunded"].includes(o.status)
  : o.status === v;

export function OrdersView({ orders }: { orders: AdminOrder[] }) {
  const [rows, setRows] = useState(orders);
  const canWrite = useCan("orders.write");

  const markPacked = (ids: string[]) => {
    const eligible = rows.filter((o) => ids.includes(o.id) && ["paid", "processing"].includes(o.status)).map((o) => o.id);
    if (!eligible.length) return void toast.info("Only paid or processing orders can be packed.");
    const before = rows;
    setRows(rows.map((o) => (eligible.includes(o.id) ? { ...o, status: "packed" } : o)));
    // TODO(backend agent): call /api/admin/orders/bulk-pack
    void mutate("orders/bulk-pack", { ids: eligible }, { success: `${eligible.length} order(s) marked packed`, rollback: () => setRows(before) });
  };

  const columns: Column<AdminOrder>[] = [
    { key: "number", header: "Order", sort: (o) => o.number, cell: (o) => <Link href={`/admin/orders/${o.number}`} className="font-medium hover:underline">{o.number}</Link> },
    { key: "customer", header: "Customer", sort: (o) => o.customerName, cell: (o) => <><span className="block">{o.customerName}</span><span className="t-meta">{o.shippingAddress.city}</span></> },
    { key: "date", header: "Placed", sort: (o) => o.placedAt, cell: (o) => formatDate(o.placedAt) },
    { key: "items", header: "Items", align: "right", cell: (o) => o.items.reduce((s, i) => s + i.quantity, 0) },
    { key: "payment", header: "Payment", sort: (o) => o.paymentStatus, cell: (o) => {
      const failed = o.paymentAttempts.filter((a) => a.status === "failed").length;
      return <span className="flex flex-col items-start gap-1"><StatusBadge status={o.paymentStatus} />{failed > 0 && <span className="t-meta">{failed} failed attempt{failed > 1 && "s"}</span>}</span>;
    } },
    { key: "status", header: "Status", sort: (o) => o.status, cell: (o) => <StatusBadge status={o.status} /> },
    { key: "total", header: "Total", align: "right", sort: (o) => o.totals.total, cell: (o) => formatPrice(o.totals.total) },
  ];

  return (
    <>
      <PageHeader title="Orders" description="Every order with payment and fulfilment state." />
      <DataTable
        caption="Orders" rows={rows} columns={columns} getId={(o) => o.id}
        search={(o) => `${o.number} ${o.customerName} ${o.email} ${o.phone}`} searchPlaceholder="Search order #, name, email or phone"
        filters={[
          { key: "status", label: "Status", options: STATUS_FILTER, match: matchStatus },
          { key: "pay", label: "Payment", options: [{ value: "captured", label: "Captured" }, { value: "failed", label: "Failed" }, { value: "refunded", label: "Refunded" }], match: (o, v) => o.paymentStatus === v },
        ]}
        bulkActions={canWrite ? [{ label: "Mark packed", onClick: markPacked }] : undefined}
        empty={{ title: "No orders yet", body: "Orders appear here as soon as checkout completes." }}
      />
    </>
  );
}
