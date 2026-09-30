"use client";

import { clsx } from "clsx";
import { AlertTriangle, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { ButtonLink } from "@/components/ui/Button";
import { QuantityStepper } from "@/components/ui/Controls";
import { Skeleton } from "@/components/ui/States";
import { cartCopy } from "@/data/copy";
import { formatPrice } from "@/lib/format";
import { MAX_PER_LINE, useCart, type CartQuoteState } from "@/stores/cart";
import type { CartLine, QuoteLine } from "@/types/domain";
import { cartExtraCopy as x } from "./copy";
import { FreeShippingProgress } from "./FreeShippingProgress";

/** One bag line. Price prefers the server quote line; the persisted snapshot is only a placeholder. */
export function CartLineRow({ line, quoteLine, error, large, onNavigate }: {
  line: CartLine; quoteLine?: QuoteLine; error?: string; large?: boolean; onNavigate?: () => void;
}) {
  const update = useCart((s) => s.update);
  const max = Math.min(line.maxQuantity, quoteLine?.maxQuantity ?? MAX_PER_LINE, MAX_PER_LINE);
  const total = quoteLine?.lineTotal ?? line.unitPrice * line.quantity;
  const was = Math.max((quoteLine?.compareAtPrice ?? line.compareAt ?? 0) * line.quantity, quoteLine?.lineSubtotal ?? 0);

  const remove = () => {
    const removed = useCart.getState().remove(line.variantId);
    if (!removed) return;
    toast(x.removed(line.name), { action: { label: x.undo, onClick: () => useCart.getState().restore(removed.line, removed.index) } });
  };
  const image = line.image?.url ? line.image : quoteLine?.image ? { url: quoteLine.image, alt: line.name } : undefined;

  return (
    <li className="flex gap-4 py-4">
      <div className={clsx("relative shrink-0 overflow-hidden rounded-sm bg-surface-2", large ? "size-28 sm:size-32" : "size-22")}>
        {image && <Image src={image.url} alt={image.alt || line.name} fill sizes="128px" className="object-cover" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {line.slug ? (
              <Link href={`/products/${line.slug}`} onClick={onNavigate} className="line-clamp-2 text-body font-medium hover:underline">{line.name}</Link>
            ) : <p className="line-clamp-2 text-body font-medium">{line.name}</p>}
            {line.variantTitle && line.variantTitle !== "Default" && <p className="text-meta text-ink-soft">{line.variantTitle}</p>}
          </div>
          <p className="text-right text-body font-medium tabular-nums">
            {formatPrice(total)}
            {was > total && <span className="block text-micro font-normal text-ink-muted line-through">{formatPrice(was)}</span>}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <QuantityStepper label={`${cartCopy.quantity}: ${line.name}`} value={line.quantity} max={Math.max(max, 1)} onChange={(n) => update(line.variantId, n)} />
          <button type="button" onClick={remove} className="inline-flex min-h-11 items-center gap-1.5 rounded-pill px-2 text-meta text-ink-soft hover:bg-surface-warm hover:text-ink">
            <Trash2 className="size-3.5" aria-hidden /> {cartCopy.remove}<span className="sr-only"> {line.name}</span>
          </button>
        </div>
        {error ? (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-meta text-warning"><AlertTriangle className="size-3.5 shrink-0" aria-hidden /> {error}</p>
        ) : line.quantity >= max && <p className="mt-1 text-micro text-ink-soft">{cartCopy.maxReached}</p>}
      </div>
    </li>
  );
}

/** All bag lines with their quote line + stock error. */
export function CartLines({ q, large, onNavigate }: { q: CartQuoteState; large?: boolean; onNavigate?: () => void }) {
  const lines = useCart((s) => s.lines);
  return (
    <ul className="divide-y divide-line-soft">
      {lines.map((l) => (
        <CartLineRow key={l.variantId} line={l} large={large} onNavigate={onNavigate}
          quoteLine={q.quote?.lines.find((ql) => ql.variantId === l.variantId)} error={q.lineErrors[l.variantId]} />
      ))}
    </ul>
  );
}

/** Free-delivery meter + server offer nudges ("add 1 more to get …"). */
export function CartNudges({ q, freeShippingThreshold }: { q: CartQuoteState; freeShippingThreshold?: number }) {
  if (!q.quote) return null;
  const net = q.quote.subtotal - q.quote.offerDiscount - q.quote.couponDiscount;
  return (
    <div className="space-y-2">
      <FreeShippingProgress net={net} threshold={freeShippingThreshold} />
      {q.nudges.map((n) => (
        <p key={n.offerId} className="flex items-start gap-2 rounded-md border border-line-soft bg-surface px-4 py-3 text-meta text-ink">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-accent-deep" aria-hidden /> {n.message}
        </p>
      ))}
    </div>
  );
}

/** Server-quoted totals + the checkout CTA. */
export function CartTotals({ q, onCheckout, hideCta }: { q: CartQuoteState; onCheckout?: () => void; hideCta?: boolean }) {
  const t = q.quote;
  const row = "flex justify-between gap-4 text-body";
  return (
    <div className="space-y-3" aria-busy={q.loading}>
      {!t ? (
        <div className="space-y-2" aria-label={x.updating}><Skeleton className="h-5" /><Skeleton className="h-5 w-2/3" /><Skeleton className="h-7" /></div>
      ) : (
        <dl className={clsx("space-y-1.5 transition-opacity duration-(--dur-fast)", q.loading && "opacity-60")}>
          <div className={row}><dt className="text-ink-soft">{cartCopy.subtotal}</dt><dd className="tabular-nums">{formatPrice(t.subtotal)}</dd></div>
          {t.appliedDiscounts.map((d) => (
            <div key={`${d.kind}-${d.id}`} className={row}>
              <dt className="text-ink-soft">{d.kind === "coupon" ? cartCopy.couponApplied(d.code ?? "") : d.name ?? x.offerLabel}</dt>
              <dd className="tabular-nums text-success">−{formatPrice(d.amount)}</dd>
            </div>
          ))}
          <div className={row}><dt className="text-ink-soft">{cartCopy.shipping}</dt><dd className="tabular-nums">{t.shipping ? formatPrice(t.shipping) : cartCopy.free}</dd></div>
          {!!t.codFee && <div className={row}><dt className="text-ink-soft">{cartCopy.codFee}</dt><dd className="tabular-nums">{formatPrice(t.codFee)}</dd></div>}
          {!t.taxInclusive && !!t.tax && <div className={row}><dt className="text-ink-soft">{cartCopy.tax}</dt><dd className="tabular-nums">{formatPrice(t.tax)}</dd></div>}
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-2.5">
            <dt className="text-body-lg font-semibold">{cartCopy.total}</dt>
            <dd className="text-body-lg font-semibold tabular-nums">{formatPrice(t.total)}</dd>
          </div>
          {t.taxInclusive && !!t.tax && <p className="text-micro text-ink-soft">{cartCopy.taxIncluded} {formatPrice(t.tax)}</p>}
          {t.discount > 0 && <p className="text-meta font-medium text-success">{x.saved(formatPrice(t.discount))}</p>}
        </dl>
      )}
      {q.error && <p role="status" className="text-meta text-warning">⚠ {q.error}</p>}
      {!hideCta && (
        <>
          {t && !t.valid && <p role="alert" className="text-meta text-warning">⚠ {x.fixItems}</p>}
          <ButtonLink href="/checkout" full size="lg" onClick={onCheckout} aria-disabled={t ? !t.valid : undefined}
            className={clsx(t && !t.valid && "pointer-events-none opacity-40")}>
            {cartCopy.checkout}{t ? ` · ${formatPrice(t.total)}` : ""}
          </ButtonLink>
          <p className="text-center text-micro text-ink-soft">{cartCopy.taxNote}</p>
        </>
      )}
    </div>
  );
}
