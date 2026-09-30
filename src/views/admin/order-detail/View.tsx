"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DefinitionList, PageHeader, Panel } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import { useCan } from "@/components/admin/useRole";
import type { AdminOrder, OrderEvent } from "@/data/admin/types";
import { formatPrice } from "@/lib/format";
import { mutate } from "../api";
import { Notes } from "./components/Notes";
import { PaymentAttempts } from "./components/PaymentAttempts";
import { RefundDialog } from "./components/RefundDialog";
import { Timeline } from "./components/Timeline";

const ME = "You";

export function OrderDetailView({ order: initial }: { order: AdminOrder }) {
  const [order, setOrder] = useState(initial);
  const [refunding, setRefunding] = useState(false);
  const canWrite = useCan("orders.write");
  const canShip = useCan("shipments.write");
  const canRefund = useCan("orders.refund");
  const captured = order.paymentAttempts.find((a) => a.status === "captured")?.amount ?? 0;

  /** Optimistic update + event; rolls back if the API fails. */
  const act = (resource: string, body: unknown, patch: Partial<AdminOrder>, label: string) => {
    const before = order;
    const event: OrderEvent = { at: new Date().toISOString(), label, actor: ME };
    setOrder({ ...order, ...patch, timeline: [...order.timeline, event] });
    // TODO(backend agent): call /api/admin/orders/<number>/<action>
    void mutate(`orders/${order.number}/${resource}`, body, { success: label, rollback: () => setOrder(before) });
  };

  const actions = (canWrite || canShip || canRefund) && (
    <>
      {canWrite && ["paid", "processing"].includes(order.status) && <Button size="sm" onClick={() => act("pack", {}, { status: "packed" }, "Marked packed")}>Mark packed</Button>}
      {canShip && order.status === "packed" && !order.shipment && (
        <Button size="sm" onClick={() => act("shipment", {}, { status: "shipped", shipment: { carrier: "Shiprocket", awb: "Pending AWB", status: "created", events: [] } }, "Shipment created")}>Create shipment</Button>
      )}
      {canRefund && captured > 0 && order.paymentStatus === "captured" && <Button size="sm" variant="secondary" onClick={() => setRefunding(true)}>Refund</Button>}
    </>
  );

  return (
    <>
      <PageHeader title={`Order ${order.number}`} description={`Placed ${formatDateTime(order.placedAt)}`} actions={actions} />
      <div className="mb-6 flex flex-wrap gap-2"><StatusBadge status={order.status} /><StatusBadge status={order.paymentStatus} /></div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Panel title="Items">
            <ul className="divide-y divide-line-soft">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3">
                  <Image src={i.image.url} alt="" width={48} height={60} className="h-15 w-12 rounded-sm object-cover" />
                  <span className="flex-1"><span className="block font-medium">{i.name}</span><span className="t-meta">{i.color} · {i.size} · Qty {i.quantity}</span></span>
                  <span className="tabular-nums">{formatPrice(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 grid gap-1 border-t border-line pt-3 text-body">
              {([["Subtotal", order.totals.subtotal], ["Discount", -order.totals.discount], ["Shipping", order.totals.shipping], ["GST (included)", order.totals.tax]] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between text-ink-soft"><dt>{k}</dt><dd className="tabular-nums">{formatPrice(v)}</dd></div>
              ))}
              <div className="flex justify-between font-semibold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.totals.total)}</dd></div>
            </dl>
          </Panel>
          <PaymentAttempts attempts={order.paymentAttempts} />
          <Panel title="Shipment">
            {order.shipment ? (
              <DefinitionList items={[
                { label: "Carrier", value: order.shipment.carrier }, { label: "AWB", value: order.shipment.awb },
                { label: "Status", value: <StatusBadge status={order.shipment.status} /> },
                { label: "Last scan", value: order.shipment.events.at(-1)?.location ?? "Awaiting pickup" },
              ]} />
            ) : <p className="t-meta">No shipment yet. Mark the order packed, then create a shipment to book a Shiprocket pickup.</p>}
          </Panel>
        </div>
        <div className="flex flex-col gap-6">
          <Panel title="Customer" actions={<Link href={`/admin/customers/${order.customerId}`} className="text-meta underline underline-offset-4">Customer 360</Link>}>
            <DefinitionList items={[
              { label: "Name", value: order.customerName }, { label: "Email", value: order.email }, { label: "Phone", value: order.phone },
              { label: "Ship to", value: `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}` },
            ]} />
          </Panel>
          <Timeline events={order.timeline} />
          <Notes notes={order.notes} disabled={!canWrite}
            onAdd={(body) => {
              const before = order;
              setOrder({ ...order, notes: [...order.notes, { id: crypto.randomUUID(), at: new Date().toISOString(), author: ME, body }] });
              void mutate(`orders/${order.number}/notes`, { body }, { success: "Note added", rollback: () => setOrder(before) });
            }} />
        </div>
      </div>
      <RefundDialog open={refunding} max={captured} onClose={() => setRefunding(false)}
        onRefund={(paise, reason) => {
          setRefunding(false);
          act("refund", { amount: paise, reason, idempotencyKey: crypto.randomUUID() },
            { paymentStatus: paise === captured ? "refunded" : "partially_refunded", status: paise === captured ? "refunded" : order.status },
            `Refunded ${formatPrice(paise)} (${reason})`);
        }} />
    </>
  );
}
