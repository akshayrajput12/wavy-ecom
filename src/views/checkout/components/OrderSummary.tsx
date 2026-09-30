import Image from "next/image";
import type { ReactNode } from "react";
import { bundleOffer, GST_RATE } from "@/data/checkout";
import { formatPrice } from "@/lib/format";
import type { OrderItem } from "@/types/domain";

type Line = Pick<OrderItem, "id" | "name" | "image" | "color" | "size" | "unitPrice" | "quantity">;
export type SummaryTotals = {
  subtotal: number; discount: number; shipping: number; tax: number; total: number;
  bundleDiscount?: number; couponDiscount?: number; codFee?: number; appliedCoupon?: string;
};

/** Line items + totals. Pure (server-safe); pass `children` for coupon input etc. */
export function OrderSummary({ lines, totals, shippingKnown = true, note, children }: {
  lines: Line[]; totals: SummaryTotals; shippingKnown?: boolean; note?: string; children?: ReactNode;
}) {
  const splitDiscount = totals.bundleDiscount !== undefined || totals.couponDiscount !== undefined;
  return (
    <section aria-labelledby="summary-h" className="rounded-md border border-line bg-surface p-5">
      <h2 id="summary-h" className="t-h3">Order summary <span className="t-meta">({lines.reduce((s, l) => s + l.quantity, 0)} items)</span></h2>
      <ul className="mt-4 divide-y divide-line-soft">
        {lines.map((l) => (
          <li key={l.id} className="flex gap-3 py-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-sm bg-surface-warm">
              <Image src={l.image.url} alt={l.image.alt} fill sizes="64px" className="object-cover" />
              <span className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-ink text-micro text-on-dark">
                {l.quantity}<span className="sr-only"> × </span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body font-medium">{l.name}</p>
              <p className="t-meta">{l.color} · {l.size}</p>
            </div>
            <p className="text-body">{formatPrice(l.unitPrice * l.quantity)}</p>
          </li>
        ))}
      </ul>
      {children}
      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-body">
        <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
        {splitDiscount ? (
          <>
            {!!totals.bundleDiscount && <Row label={bundleOffer.label} value={`− ${formatPrice(totals.bundleDiscount)}`} tone="success" />}
            {!!totals.couponDiscount && <Row label={`Coupon ${totals.appliedCoupon ?? ""}`} value={`− ${formatPrice(totals.couponDiscount)}`} tone="success" />}
          </>
        ) : (
          !!totals.discount && <Row label={totals.appliedCoupon ? `Discount (${totals.appliedCoupon})` : "Discount"} value={`− ${formatPrice(totals.discount)}`} tone="success" />
        )}
        <Row label="Shipping" value={!shippingKnown ? "Calculated next" : totals.shipping ? formatPrice(totals.shipping) : "Free"} />
        {!!totals.codFee && <Row label="Cash on delivery fee" value={formatPrice(totals.codFee)} />}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <dt className="text-body-lg font-semibold">Total</dt>
          <dd className="t-h2">{formatPrice(totals.total)}</dd>
        </div>
        <Row label={`Includes GST (${Math.round(GST_RATE * 100)}%)`} value={formatPrice(totals.tax)} muted />
      </dl>
      {note && <p className="mt-3 t-meta">{note}</p>}
    </section>
  );
}

function Row({ label, value, tone, muted }: { label: string; value: string; tone?: "success"; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${muted ? "t-meta" : ""}`}>
      <dt className={tone === "success" ? "text-success" : undefined}>{label}</dt>
      <dd className={tone === "success" ? "text-success" : undefined}>{value}</dd>
    </div>
  );
}
