"use client";

import { clsx } from "clsx";
import { AlertTriangle, Sparkles } from "lucide-react";
import { ArrowRightIcon } from "@/components/ui/icons";
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
    <li className="flex gap-4 py-5">
      <div className={clsx("relative aspect-[4/5] shrink-0 overflow-hidden rounded-md bg-surface-2", large ? "w-24 sm:w-32" : "w-20")}>
        {image && <Image src={image.url} alt={image.alt || line.name} fill sizes="128px" className="object-cover" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {line.slug ? (
              <Link href={`/products/${line.slug}`} onClick={onNavigate} className="line-clamp-2 text-meta font-medium hover:underline hover:underline-offset-4 sm:text-body">{line.name}</Link>
            ) : <p className="line-clamp-2 text-meta font-medium sm:text-body">{line.name}</p>}
            {line.variantTitle && line.variantTitle !== "Default" && <p className="mt-0.5 text-meta text-ink-soft">{line.variantTitle}</p>}
          </div>
          <p className="text-right text-meta font-medium tabular-nums sm:text-body">
            {formatPrice(total)}
            {was > total && <span className="block text-micro font-normal text-ink-muted line-through">{formatPrice(was)}</span>}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <QuantityStepper label={`${cartCopy.quantity}: ${line.name}`} value={line.quantity} max={Math.max(max, 1)} onChange={(n) => update(line.variantId, n)} />
          <button type="button" onClick={remove} className="inline-flex min-h-11 items-center px-1 text-meta text-ink-soft underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink">
            {cartCopy.remove}<span className="sr-only"> {line.name}</span>
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
    <ul className="divide-y divide-line border-y border-line">
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
        <p key={n.offerId} className="flex items-start gap-2 rounded-lg border border-line px-4 py-3 text-meta text-ink">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-ink" aria-hidden /> {n.message}
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
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <dt className="t-h3">{cartCopy.total}</dt>
            <dd className="t-h3 tabular-nums">{formatPrice(t.total)}</dd>
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
            <ArrowRightIcon className="size-4" />
          </ButtonLink>
          <p className="text-center text-micro text-ink-soft">{cartCopy.taxNote}</p>
        </>
      )}
    </div>
  );
}
