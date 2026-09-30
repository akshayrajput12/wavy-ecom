import Image from "next/image";
import type { ReactNode } from "react";
import { cartCopy } from "@/data/copy";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/types/domain";
import { co } from "../copy";

/** Placed order: items + stored totals (server-safe). Used by the success page and account order detail. */
export function OrderSummary({ order, children }: { order: Pick<Order, "items" | "totals">; children?: ReactNode }) {
  const t = order.totals;
  const count = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <section aria-labelledby="receipt-h" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
      <h2 id="receipt-h" className="t-h3">{co.summary.title} <span className="t-meta">({co.summary.items(count)})</span></h2>
      <ul className="mt-4 divide-y divide-line-soft">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 py-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-surface-2">
              {i.image?.url && <Image src={i.image.url} alt={i.image.alt || i.name} fill sizes="56px" className="object-cover" />}
            </span>
            <span className="min-w-0 flex-1 text-body">
              <span className="line-clamp-1 font-medium">{i.name}</span>
              <span className="block text-meta text-ink-soft">{i.variantTitle !== "Default" ? `${i.variantTitle} · ` : ""}{cartCopy.quantity} {i.quantity}</span>
            </span>
            <span className="text-body tabular-nums">{formatPrice(i.lineTotal)}</span>
          </li>
        ))}
      </ul>
      {children}
      <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-body">
        <Row label={cartCopy.subtotal} value={formatPrice(t.subtotal)} />
        {!!t.discount && <Row label={t.appliedCoupon ? cartCopy.couponApplied(t.appliedCoupon) : cartCopy.discount} value={`−${formatPrice(t.discount)}`} good />}
        <Row label={cartCopy.shipping} value={t.shipping ? formatPrice(t.shipping) : cartCopy.free} />
        {!!t.codFee && <Row label={cartCopy.codFee} value={formatPrice(t.codFee)} />}
        {!!t.tax && <Row label={cartCopy.tax} value={formatPrice(t.tax)} />}
        <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2.5">
          <dt className="text-body-lg font-semibold">{cartCopy.total}</dt>
          <dd className="text-body-lg font-semibold tabular-nums">{formatPrice(t.total)}</dd>
        </div>
      </dl>
    </section>
  );
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={good ? "tabular-nums text-success" : "tabular-nums"}>{value}</dd>
    </div>
  );
}
