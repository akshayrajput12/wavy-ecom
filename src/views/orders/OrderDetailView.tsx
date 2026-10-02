import { FileText } from "lucide-react";
import { ArrowLeftIcon, RotateCcwIcon, TruckIcon } from "@/components/ui/icons";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { accountCopy, invoiceCopy, orderStatusLabels, paymentStatusLabels } from "@/data/copy";
import { formatDate } from "@/lib/format";
import type { Order } from "@/types/domain";
import { ac } from "@/views/account/copy";
import { OrderSummary } from "@/views/checkout/components/OrderSummary";
import { co } from "@/views/checkout/copy";
import { Timeline } from "@/views/tracking/components/Timeline";
import { CancelOrder } from "./components/CancelOrder";

/** `invoiceHref`: set once the GST invoice exists (GET /api/orders/:number/invoice checks ownership). */
export function OrderDetailView({ order, canCancel, canReturn, invoiceHref }: { order: Order; canCancel: boolean; canReturn: boolean; invoiceHref?: string }) {
  const a = order.shippingAddress;
  return (
    <div className="grid gap-8">
      <Link href="/account/orders" className="inline-flex min-h-11 items-center gap-2 self-start text-meta text-ink-soft hover:text-ink">
        <ArrowLeftIcon className="size-4" /> {ac.allOrders}
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-3">
          <p className="t-overline">{ac.orders}</p>
          <h1 className="t-h1">{ac.order(order.number)}</h1>
          <p className="text-body text-ink-soft">{ac.placed(formatDate(order.placedAt))}{order.shippingMethodName && ` · ${order.shippingMethodName}`}</p>
        </div>
        <Badge tone={order.status === "cancelled" ? "danger" : "info"} dot>{orderStatusLabels[order.status]}</Badge>
      </header>

      <div className="flex flex-wrap gap-2">
        {order.trackingToken && order.status !== "cancelled" && (
          <ButtonLink href={`/track/${order.trackingToken}`}><TruckIcon className="size-4" /> {ac.track}</ButtonLink>
        )}
        {canReturn && (
          <ButtonLink href={`/account/returns/new?order=${encodeURIComponent(order.number)}`} variant="secondary">
            <RotateCcwIcon className="size-4" /> {accountCopy.requestReturn}
          </ButtonLink>
        )}
        {invoiceHref && (
          <a href={invoiceHref} download className={buttonClass({ variant: "secondary" })}>
            <FileText className="size-4" aria-hidden /> {invoiceCopy.download}
          </a>
        )}
        {canCancel && <CancelOrder number={order.number} />}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid content-start gap-6">
          <section aria-labelledby="tl-h" className="rounded-xl border border-line bg-surface p-5 sm:p-6">
            <h2 id="tl-h" className="mb-6 t-h3">{ac.progress}</h2>
            <Timeline order={order} />
          </section>
          <section aria-labelledby="pay-h" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-5 sm:p-6">
            <div>
              <h2 id="pay-h" className="t-h3">{ac.payment}</h2>
              <p className="t-meta">{co.success.paidWith[order.paymentProvider]}</p>
            </div>
            <Badge tone={order.paymentStatus === "failed" ? "danger" : order.paymentStatus === "captured" ? "success" : "warning"} dot>
              {paymentStatusLabels[order.paymentStatus]}
            </Badge>
          </section>
          <section aria-labelledby="addr-h" className="rounded-xl border border-line bg-surface p-5 sm:p-6">
            <h2 id="addr-h" className="t-h3">{ac.address}</h2>
            <address className="mt-2 text-body not-italic text-ink-soft">
              <span className="font-medium text-ink">{a.name}</span> · {a.phone}<br />
              {[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}<br />{a.city}, {a.state} {a.postalCode}
            </address>
          </section>
        </div>
        <div className="xl:sticky xl:top-[calc(var(--header-h)+1.5rem)] xl:self-start"><OrderSummary order={order} /></div>
      </div>
    </div>
  );
}
