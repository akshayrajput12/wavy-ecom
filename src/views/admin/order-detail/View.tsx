import Link from "next/link";
import { DefinitionList, PageHeader, Panel } from "@/components/admin/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/format";
import type { AdminOrderDetail } from "@/types/admin";
import { fmtDateTime } from "../orders/components/fmt";
import { Items } from "./components/Items";
import { Notes, StatusHistory } from "./components/Notes";
import { PaymentTimeline } from "./components/PaymentTimeline";
import { RefundPanel } from "./components/RefundPanel";
import { Shipments } from "./components/Shipments";
import { StatusPanel } from "./components/StatusPanel";

function addressLines(a: unknown): string[] {
  if (!a || typeof a !== "object") return [];
  const r = a as Record<string, unknown>;
  return ["name", "line1", "line2", "landmark", "city", "state", "postalCode", "postal_code", "phone"].map((k) => r[k]).filter((v): v is string => typeof v === "string" && !!v);
}

export function OrderDetailView({ order }: { order: AdminOrderDetail }) {
  return (
    <>
      <PageHeader title={`Order ${order.orderNumber}`} description={`Placed ${fmtDateTime(order.placedAt)} · ${formatPrice(order.total)}`}
        actions={<><StatusBadge status={order.status} /><Link href="/admin/orders" className="text-meta underline">All orders</Link></>} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Items order={order} />
          <PaymentTimeline order={order} />
          <RefundPanel order={order} />
          <Shipments orderNumber={order.orderNumber} shipments={order.shipments} />
          {order.returns.length > 0 && (
            <Panel title="Returns">
              <ul className="flex flex-col gap-2">{order.returns.map((r) => <li key={r.id} className="flex items-center gap-2 text-body">{r.rmaNumber} <StatusBadge status={r.status} /><span className="t-meta">{r.reason.replace(/_/g, " ")}</span></li>)}</ul>
              <Link href="/admin/returns" className="mt-3 inline-block text-meta underline">Manage returns</Link>
            </Panel>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <StatusPanel order={order} />
          <Panel title="Customer">
            <DefinitionList items={[
              { label: "Name", value: order.customerName }, { label: "Email", value: order.email }, { label: "Phone", value: order.phone },
              { label: "Ship to", value: addressLines(order.shippingAddress).join(", ") || "-" },
              { label: "Method", value: order.shippingMethodName ?? "-" },
              ...(order.userId ? [{ label: "Account", value: <Link href={`/admin/customers/${order.userId}`} className="underline">View customer</Link> }] : []),
            ]} />
          </Panel>
          <Notes order={order} />
          <StatusHistory history={order.history} />
        </div>
      </div>
    </>
  );
}
