import { Mail, Package } from "lucide-react";
import Image from "next/image";
import { StatusBadge } from "@/components/ui/Badge";
import { accountCopy } from "@/data/account";
import type { AccountOrder } from "@/data/orders";
import { site } from "@/data/site";
import { formatDate } from "@/lib/format";
import { Timeline } from "./components/Timeline";

/** Public tracking (token only): shows shipment + items, never contact details or the full address. */
export function TrackingView({ order }: { order: AccountOrder }) {
  const s = order.shipment;
  return (
    <div className="mx-auto grid w-full max-w-xl gap-6 py-8 sm:py-12">
      <header className="grid gap-2">
        <p className="t-overline text-ink-soft">Track order #{order.number}</p>
        <h1 className="t-h1">
          {!s ? "Preparing your order" : s.status === "delivered" ? "Delivered" : s.eta ? `Arriving by ${formatDate(s.eta)}` : "On its way"}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={s?.status ?? order.status} />
          <span className="t-meta">To {order.shippingAddress.city}, {order.shippingAddress.state}</span>
        </div>
      </header>

      {s ? (
        <>
          <dl className="grid grid-cols-2 gap-4 rounded-md border border-line bg-surface p-5 text-body">
            <div><dt className="t-meta">Carrier</dt><dd className="font-medium">{s.carrier}</dd></div>
            <div><dt className="t-meta">AWB / tracking no.</dt><dd className="font-medium break-all">{s.awb}</dd></div>
            {s.eta && <div><dt className="t-meta">{s.status === "delivered" ? "Delivered on" : "Estimated delivery"}</dt><dd className="font-medium">{formatDate(s.eta)}</dd></div>}
            <div><dt className="t-meta">Shipping</dt><dd className="font-medium">{order.shippingMethod}</dd></div>
          </dl>
          <section aria-labelledby="tl-h" className="rounded-md border border-line bg-surface p-5">
            <h2 id="tl-h" className="t-h3 mb-5">Shipment progress</h2>
            <Timeline status={s.status} events={s.events} />
          </section>
        </>
      ) : (
        <p className="flex items-center gap-3 rounded-md border border-line bg-surface p-5 text-body text-ink-soft">
          <Package className="size-5 shrink-0" aria-hidden /> We&apos;ll share carrier and tracking details as soon as your order ships.
        </p>
      )}

      <section aria-labelledby="items-h" className="rounded-md border border-line bg-surface p-5">
        <h2 id="items-h" className="t-h3">In this shipment</h2>
        <ul className="mt-3 grid gap-3">
          {order.items.map((i) => (
            <li key={i.id} className="flex items-center gap-3">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-sm bg-surface-warm">
                <Image src={i.image.url} alt={i.image.alt} fill sizes="48px" className="object-cover" />
              </span>
              <span className="text-body">{i.name}<span className="block t-meta">{i.color} · {i.size} · Qty {i.quantity}</span></span>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-2 rounded-md bg-surface-warm p-5">
        <h2 className="t-h3">Need help?</h2>
        <p className="text-body text-ink-soft">{accountCopy.trackingHelp}</p>
        <a href={`mailto:${site.supportEmail}?subject=Order%20${order.number}`} className="inline-flex min-h-11 items-center gap-2 font-medium underline underline-offset-4">
          <Mail className="size-4" aria-hidden /> {site.supportEmail}
        </a>
      </section>
    </div>
  );
}
