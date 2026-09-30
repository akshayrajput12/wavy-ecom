import { ExternalLink, Package } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { accountCopy, orderStatusLabels } from "@/data/copy";
import { formatDate } from "@/lib/format";
import type { OrderTracking } from "@/types/domain";
import { ac } from "@/views/account/copy";
import { Timeline } from "./components/Timeline";

/** Public tracking by token: journey + items, never contact details or the street address. */
export function TrackingView({ order, supportEmail }: { order: OrderTracking; supportEmail?: string }) {
  const s = order.shipment;
  const title = order.status === "cancelled" ? orderStatusLabels.cancelled
    : order.deliveredAt || s?.status === "delivered" ? ac.delivered
    : s?.eta ? ac.arriving(formatDate(s.eta)) : s ? ac.onItsWay : ac.preparing;
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 py-8 sm:py-12">
      <header className="grid gap-2">
        <p className="t-overline text-ink-soft">{ac.trackTitle(order.number)}</p>
        <h1 className="t-h1">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent" dot>{orderStatusLabels[order.status]}</Badge>
          <span className="t-meta">{ac.to(`${order.shipTo.city}, ${order.shipTo.state}`)} · {ac.placed(formatDate(order.placedAt))}</span>
        </div>
      </header>

      <section aria-labelledby="tl-h" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
        <h2 id="tl-h" className="sr-only">{ac.progress}</h2>
        <Timeline order={order} />
      </section>

      {s ? (
        <dl className="grid grid-cols-2 gap-4 rounded-lg border border-line bg-surface p-5 text-body sm:grid-cols-3">
          <div><dt className="t-meta">{ac.carrier}</dt><dd className="font-medium">{s.carrier}</dd></div>
          <div><dt className="t-meta">{ac.awb}</dt><dd className="break-all font-medium">{s.awb}</dd></div>
          {s.eta && <div><dt className="t-meta">{ac.eta}</dt><dd className="font-medium">{formatDate(s.eta)}</dd></div>}
          {s.trackingUrl && (
            <a href={s.trackingUrl} target="_blank" rel="noopener noreferrer" className="col-span-full inline-flex min-h-11 items-center gap-2 font-medium underline underline-offset-4">
              <ExternalLink className="size-4" aria-hidden /> {ac.carrierLink}
            </a>
          )}
        </dl>
      ) : (
        <p className="flex items-center gap-3 rounded-lg border border-line bg-surface p-5 text-body text-ink-soft">
          <Package className="size-5 shrink-0" aria-hidden /> {ac.noShipment}
        </p>
      )}

      <section aria-labelledby="items-h" className="rounded-lg border border-line bg-surface p-5">
        <h2 id="items-h" className="t-h3">{ac.inShipment}</h2>
        <ul className="mt-3 grid gap-3">
          {order.items.map((i, n) => (
            <li key={n} className="flex items-center gap-3">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-sm bg-surface-2">
                {i.image?.url && <Image src={i.image.url} alt={i.image.alt || i.name} fill sizes="48px" className="object-cover" />}
              </span>
              <span className="text-body">{i.name}<span className="block t-meta">{i.variantTitle !== "Default" ? `${i.variantTitle} · ` : ""}{ac.qty} {i.quantity}</span></span>
            </li>
          ))}
        </ul>
      </section>

      {supportEmail && (
        <p className="rounded-lg bg-surface-warm p-5 text-body text-ink-soft">
          {accountCopy.trackingHelp}{" "}
          <a href={`mailto:${supportEmail}?subject=${encodeURIComponent(`Order ${order.number}`)}`} className="font-medium text-ink underline underline-offset-4">{supportEmail}</a>
        </p>
      )}
    </div>
  );
}
