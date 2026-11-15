import { FileText, Truck, CheckCircle2 } from "lucide-react";
import type { GuestInvoiceOffer } from "@/backend/invoices/access";
import { ButtonLink } from "@/components/ui/Button";
import { cartCopy, checkoutCopy } from "@/data/copy";
import { formatDate } from "@/lib/format";
import type { Order } from "@/types/domain";
import { ThermalPrinterReceipt } from "./components/ThermalPrinterReceipt";
import { SuccessCelebration } from "./components/SuccessCelebration";
import { co } from "./copy";

const DAY = 86_400_000;
const eta = (placedAt: string, d: { minDays: number; maxDays: number }) => {
  const t = new Date(placedAt).getTime();
  return `${formatDate(new Date(t + d.minDays * DAY))} - ${formatDate(new Date(t + d.maxDays * DAY))}`;
};

export type SuccessInvoice = { state: "owner"; href: string } | GuestInvoiceOffer;

/**
 * Order confirmation view featuring the animated thermal printer POS receipt,
 * top confirmation header, working PDF download/print/tear actions, and 4-second vibe soundtrack preview.
 */
export function SuccessView({
  number,
  order,
  token,
  days,
  signedIn,
  invoice,
}: {
  number: string;
  order: Order | null;
  token?: string;
  days?: { minDays: number; maxDays: number };
  signedIn: boolean;
  invoice?: SuccessInvoice | null;
}) {
  const trackToken = order?.trackingToken ?? token;
  const pending = order?.status === "pending_payment";
  const a = order?.shippingAddress;

  const invoiceHref =
    invoice?.state === "owner"
      ? invoice.href
      : invoice?.state === "ready"
      ? invoice.href
      : undefined;

  return (
    <div className="mx-auto grid max-w-3xl gap-8 py-10 sm:py-14 container-x">
      {/* Top Confirmation Header */}
      <header className="grid justify-items-center gap-3 text-center">
        <SuccessCelebration />
        
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-body font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="size-5 text-emerald-500" />
          <span>Order Placed ✓</span>
        </div>

        <h1 className="t-display text-balance">{checkoutCopy.successTitle}</h1>
        <p className="text-body-lg">
          {co.success.number} <span className="font-mono font-bold tracking-wider text-ink">#{number}</span>
        </p>
        
        {order && <p className="t-meta text-ink-soft">{co.success.emailed(order.email)}</p>}
        {pending && (
          <p role="status" className="rounded-md bg-warning/10 px-4 py-2 text-meta text-warning font-medium">
            ⚠ {co.success.pending}
          </p>
        )}

        {/* Action Shortcuts */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {trackToken && (
            <ButtonLink href={`/track/${trackToken}`} size="lg" className="rounded-full shadow-md">
              <Truck className="size-4" aria-hidden /> {co.success.track}
            </ButtonLink>
          )}
          {signedIn && (
            <ButtonLink href={`/account/orders/${number}`} size="lg" variant="secondary" className="rounded-full">
              {co.success.viewOrder}
            </ButtonLink>
          )}
          <ButtonLink href="/" size="lg" variant="ghost" className="rounded-full">
            {cartCopy.continue}
          </ButtonLink>
        </div>
      </header>

      {/* Main Experience: Animated Thermal Printer POS Receipt */}
      <section aria-label="Animated Thermal Printer Order Receipt">
        <ThermalPrinterReceipt order={order} number={number} invoiceHref={invoiceHref} />
      </section>

      {/* Delivery & Address Details */}
      {order && (
        <dl className="grid gap-4 rounded-2xl border border-line bg-surface p-6 sm:grid-cols-3">
          {(order.shipment?.eta || days) && (
            <div>
              <dt className="t-meta text-ink-soft">{co.success.eta}</dt>
              <dd className="font-medium text-ink">
                {order.shipment?.eta ? formatDate(order.shipment.eta) : eta(order.placedAt, days!)}
              </dd>
            </div>
          )}
          {a && (
            <div>
              <dt className="t-meta text-ink-soft">{co.success.shipTo}</dt>
              <dd className="font-medium text-ink">
                {a.name}, {a.city}
              </dd>
            </div>
          )}
          <div>
            <dt className="t-meta text-ink-soft">{order.shippingMethodName ?? cartCopy.shipping}</dt>
            <dd className="font-medium text-ink">
              {co.success.paidWith[order.paymentProvider]}
            </dd>
          </div>
        </dl>
      )}

      {!signedIn && (
        <section className="grid justify-items-center gap-3 rounded-2xl border border-line bg-surface-warm p-6 text-center">
          <p className="text-body text-ink-soft">{checkoutCopy.guestPrompt}</p>
          <ButtonLink href="/signup" variant="secondary" className="rounded-full">
            {co.success.createAccount}
          </ButtonLink>
        </section>
      )}
    </div>
  );
}
