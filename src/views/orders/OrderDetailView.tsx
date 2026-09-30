import { ArrowLeft, FileText, RotateCcw, Truck } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { FAILURE_STAGES } from "@/data/checkout";
import type { AccountOrder } from "@/data/orders";
import { site } from "@/data/site";
import { formatDate, formatPrice } from "@/lib/format";
import { OrderSummary } from "@/views/checkout/components/OrderSummary";
import { Timeline } from "@/views/tracking/components/Timeline";

export function OrderDetailView({ order, canReturn }: { order: AccountOrder; canReturn: boolean }) {
  const a = order.shippingAddress;
  const paid = order.paymentStatus === "captured" || order.paymentStatus === "partially_refunded";
  return (
    <div className="grid gap-6">
      <Link href="/account/orders" className="inline-flex min-h-11 items-center gap-2 text-meta text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> All orders
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="t-h1">Order #{order.number}</h1>
          <p className="t-meta">Placed {formatDate(order.placedAt)} · {order.shippingMethod}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <div className="flex flex-wrap gap-3">
        {order.shipment && order.trackingToken && (
          <ButtonLink href={`/track/${order.trackingToken}`} size="sm"><Truck className="size-4" aria-hidden /> Track shipment</ButtonLink>
        )}
        {canReturn && (
          <ButtonLink href={`/account/returns/new?order=${order.number}`} size="sm" variant="secondary"><RotateCcw className="size-4" aria-hidden /> Return items</ButtonLink>
        )}
        {paid && (
          <ButtonLink href={`/api/orders/${order.number}/invoice`} prefetch={false} size="sm" variant="ghost"><FileText className="size-4" aria-hidden /> Invoice</ButtonLink>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid content-start gap-6">
          {order.shipment && (
            <section aria-labelledby="ship-h" className="rounded-md border border-line bg-surface p-5">
              <h2 id="ship-h" className="t-h3">Shipment</h2>
              <p className="mt-1 t-meta">
                {order.shipment.carrier} · AWB {order.shipment.awb}
                {order.shipment.eta && ` · ${order.shipment.status === "delivered" ? "Delivered" : "Expected"} ${formatDate(order.shipment.eta)}`}
              </p>
              <div className="mt-5"><Timeline status={order.shipment.status} events={order.shipment.events} /></div>
            </section>
          )}

          <section aria-labelledby="pay-h" className="rounded-md border border-line bg-surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="pay-h" className="t-h3">Payment</h2>
              <StatusBadge status={order.paymentStatus} />
            </div>
            <ul className="mt-3 divide-y divide-line-soft">
              {order.paymentAttempts.map((p, i) => (
                <li key={p.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-body">
                  <div>
                    <p>Attempt {i + 1} · {p.method}</p>
                    <p className="t-meta">{formatDate(p.at)} · {formatPrice(p.amount)}</p>
                    {p.failureStage && <p className="t-meta text-danger">{FAILURE_STAGES[p.failureStage]}</p>}
                  </div>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
            {order.status === "pending_payment" && (
              <p className="mt-2 text-body text-ink-soft">
                No amount was captured for this order. Any debit is auto-refunded within 5–7 business days. Questions?{" "}
                <a className="text-ink underline underline-offset-4" href={`mailto:${site.supportEmail}?subject=Order%20${order.number}`}>{site.supportEmail}</a>
              </p>
            )}
          </section>

          <section aria-labelledby="addr-h" className="rounded-md border border-line bg-surface p-5">
            <h2 id="addr-h" className="t-h3">Delivery address</h2>
            <address className="mt-2 text-body not-italic text-ink-soft">
              <span className="font-medium text-ink">{a.name}</span> · {a.phone}<br />
              {[a.line1, a.line2].filter(Boolean).join(", ")}<br />{a.city}, {a.state} {a.postalCode}
            </address>
          </section>
        </div>
        <div className="xl:sticky xl:top-[calc(var(--header-h)+1.5rem)] xl:self-start">
          <OrderSummary lines={order.items} totals={order.totals} />
        </div>
      </div>
    </div>
  );
}
