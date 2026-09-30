import { Truck } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { cartCopy, checkoutCopy } from "@/data/copy";
import { formatDate } from "@/lib/format";
import type { Order } from "@/types/domain";
import { OrderSummary } from "./components/OrderSummary";
import { SuccessCelebration } from "./components/SuccessCelebration";
import { co } from "./copy";

const DAY = 86_400_000;
const eta = (placedAt: string, d: { minDays: number; maxDays: number }) => {
  const t = new Date(placedAt).getTime();
  return `${formatDate(new Date(t + d.minDays * DAY))} - ${formatDate(new Date(t + d.maxDays * DAY))}`;
};

/** Order confirmation. `order` is null when the viewer can't be verified (no token): show the number only. */
export function SuccessView({ number, order, token, days, signedIn }: {
  number: string; order: Order | null; token?: string; days?: { minDays: number; maxDays: number }; signedIn: boolean;
}) {
  const trackToken = order?.trackingToken ?? token;
  const pending = order?.status === "pending_payment";
  const a = order?.shippingAddress;
  return (
    <div className="mx-auto grid max-w-2xl gap-8 py-10 sm:py-14">
      <header className="grid justify-items-center gap-3 text-center">
        <SuccessCelebration />
        <p className="t-overline text-accent-deep">{co.success.overline}</p>
        <h1 className="t-display text-balance">{checkoutCopy.successTitle}</h1>
        <p className="text-body-lg">{co.success.number} <span className="font-semibold tabular-nums">{number}</span></p>
        {order && <p className="t-meta">{co.success.emailed(order.email)}</p>}
        {pending && <p role="status" className="rounded-md bg-warning/10 px-4 py-2 text-meta text-warning">{co.success.pending}</p>}
      </header>

      {order && (
        <dl className="grid gap-4 rounded-lg border border-line bg-surface p-5 sm:grid-cols-3">
          {(order.shipment?.eta || days) && (
            <div><dt className="t-meta">{co.success.eta}</dt><dd className="font-medium">{order.shipment?.eta ? formatDate(order.shipment.eta) : eta(order.placedAt, days!)}</dd></div>
          )}
          {a && <div><dt className="t-meta">{co.success.shipTo}</dt><dd className="font-medium">{a.name}, {a.city}</dd></div>}
          <div><dt className="t-meta">{order.shippingMethodName ?? cartCopy.shipping}</dt><dd className="font-medium">{co.success.paidWith[order.paymentProvider]}</dd></div>
        </dl>
      )}

      {order && <OrderSummary order={order} />}

      <div className="flex flex-wrap justify-center gap-3">
        {trackToken && <ButtonLink href={`/track/${trackToken}`} size="lg"><Truck className="size-4" aria-hidden /> {co.success.track}</ButtonLink>}
        {signedIn && <ButtonLink href={`/account/orders/${number}`} size="lg" variant="secondary">{co.success.viewOrder}</ButtonLink>}
        <ButtonLink href="/" size="lg" variant="ghost">{cartCopy.continue}</ButtonLink>
      </div>

      {!signedIn && (
        <section className="grid justify-items-center gap-3 rounded-lg bg-surface-warm p-6 text-center">
          <p className="text-body text-ink-soft">{checkoutCopy.guestPrompt}</p>
          <ButtonLink href="/signup" variant="secondary">{co.success.createAccount}</ButtonLink>
        </section>
      )}
    </div>
  );
}
