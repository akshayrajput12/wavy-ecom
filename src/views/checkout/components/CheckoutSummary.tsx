"use client";

import { ChevronUp } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { CartNudges, CartTotals } from "@/components/commerce/cart/CartParts";
import { CouponForm } from "@/components/commerce/cart/CouponForm";
import { Drawer } from "@/components/ui/Drawer";
import { formatPrice } from "@/lib/format";
import { cartCount, useCart, type CartQuoteState, type QuoteOptions } from "@/stores/cart";
import { co } from "../copy";

type Props = { q: CartQuoteState; threshold?: number; context: Omit<QuoteOptions, "enabled"> };

function SummaryBody({ q, threshold, context }: Props) {
  const lines = useCart((s) => s.lines);
  return (
    <div className="grid gap-4">
      <ul className="divide-y divide-line border-b border-line">
        {lines.map((l) => {
          const ql = q.quote?.lines.find((x) => x.variantId === l.variantId);
          const src = l.image?.url || ql?.image;
          return (
            <li key={l.variantId} className="flex items-center gap-3 py-3 first:pt-0">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-md bg-surface-2">
                {src && <Image src={src} alt={l.image?.alt || l.name} fill sizes="64px" className="object-cover" />}
                <span className="t-index absolute right-1 top-1 grid size-5 place-items-center rounded-pill bg-ink text-canvas">{l.quantity}<span className="sr-only"> ×</span></span>
              </span>
              <span className="min-w-0 flex-1 text-body">
                <span className="line-clamp-1 font-medium">{l.name}</span>
                {l.variantTitle !== "Default" && <span className="block text-meta text-ink-soft">{l.variantTitle}</span>}
                {q.lineErrors[l.variantId] && <span role="alert" className="block text-meta text-warning">⚠ {q.lineErrors[l.variantId]}</span>}
              </span>
              <span className="text-body tabular-nums">{formatPrice(ql?.lineTotal ?? l.unitPrice * l.quantity)}</span>
            </li>
          );
        })}
      </ul>
      <CartNudges q={q} freeShippingThreshold={threshold} />
      <CouponForm quoteCoupon={q.quote?.coupon} context={context} />
      <CartTotals q={q} hideCta />
    </div>
  );
}

/** Desktop: sticky card. Mobile: sticky bottom bar with the total that opens the summary as a bottom sheet. */
export function CheckoutSummary(props: Props) {
  const [open, setOpen] = useState(false);
  const count = useCart((s) => cartCount(s.lines));
  const total = props.q.quote?.total;
  return (
    <>
      <aside aria-labelledby="summary-h" className="hidden rounded-xl border border-line bg-surface p-7 lg:sticky lg:top-6 lg:block">
        <h2 id="summary-h" className="mb-5 border-b border-line pb-4 t-h3">{co.summary.title} <span className="t-meta">({co.summary.items(count)})</span></h2>
        <SummaryBody {...props} />
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-pill bg-ink pl-2 pr-5 text-body text-canvas shadow-lg">
          <span className="inline-flex items-center gap-3 font-medium"><span aria-hidden className="grid size-10 place-items-center rounded-pill bg-canvas/15"><ChevronUp className="size-4" /></span> {co.summary.show} · {co.summary.items(count)}</span>
          <span className="text-body-lg font-semibold tabular-nums">{total === undefined ? "…" : formatPrice(total)}</span>
        </button>
      </div>
      <Drawer open={open} onClose={() => setOpen(false)} side="bottom" title={co.summary.title}>
        <SummaryBody {...props} />
      </Drawer>
    </>
  );
}
