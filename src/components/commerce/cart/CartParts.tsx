"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { QuantityStepper } from "@/components/ui/Controls";
import { ButtonLink, Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { bundleOffer, cartCopy, shippingRule } from "@/data/content";
import type { CartLine, Product } from "@/types/domain";
import { estimateCart } from "./cartMath";

export const useCartEstimate = (bundleIds: readonly string[]) => {
  const lines = useCart((s) => s.lines);
  return estimateCart(lines, {
    bundleIds, bundleSize: bundleOffer.size, bundlePrice: bundleOffer.price,
    freeThreshold: shippingRule.freeThreshold, shippingFee: shippingRule.fee,
  });
};

export function CartLineRow({ line, large }: { line: CartLine; large?: boolean }) {
  const update = useCart((s) => s.update);
  const remove = useCart((s) => s.remove);
  return (
    <li className="flex gap-4 py-5">
      <div className={clsx("relative shrink-0 overflow-hidden rounded-sm bg-surface-warm", large ? "h-36 w-28 sm:h-44 sm:w-36" : "h-28 w-22")}>
        <Image src={line.image.url} alt={line.image.alt} fill sizes="144px" className="object-cover" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={clsx("font-medium", large ? "text-body-lg" : "text-body")}>{line.name}</p>
            <p className="text-meta text-ink-soft">{line.color} · {line.size}</p>
          </div>
          <p className="text-body font-medium tabular-nums">{formatPrice(line.unitPrice * line.quantity)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <QuantityStepper label={`${cartCopy.quantity}: ${line.name}`} value={line.quantity} max={line.maxQuantity} onChange={(n) => update(line.id, n)} />
          <button type="button" onClick={() => remove(line.id)} className="inline-flex min-h-11 items-center gap-1.5 text-meta text-ink-soft underline-offset-4 hover:text-ink hover:underline">
            <Trash2 className="size-3.5" aria-hidden /> {cartCopy.remove}<span className="sr-only"> {line.name}</span>
          </button>
        </div>
        {line.quantity >= line.maxQuantity && <p className="mt-1 text-micro text-warning">{cartCopy.maxReached}</p>}
      </div>
    </li>
  );
}

/** Bundle nudge + free-shipping progress. */
export function CartNudges({ bundleIds }: { bundleIds: readonly string[] }) {
  const e = useCartEstimate(bundleIds);
  const pct = Math.min(100, ((shippingRule.freeThreshold - e.freeShippingRemaining) / shippingRule.freeThreshold) * 100);
  return (
    <div className="space-y-3">
      {e.itemsForBundle > 0 && (
        <p className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-accent/25 px-3 py-2.5 text-meta font-medium text-ink">
          {cartCopy.nudge(e.itemsForBundle)}
          <Link href={bundleOffer.href} className="underline underline-offset-4">{cartCopy.nudgeCta}</Link>
        </p>
      )}
      <div>
        <p className="text-meta text-ink-soft">
          {e.freeShippingRemaining > 0 ? cartCopy.freeShipLeft(formatPrice(e.freeShippingRemaining)) : cartCopy.freeShipDone}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-pill bg-line-soft" aria-hidden>
          <div className="h-full rounded-pill bg-ink transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function CartTotals({ bundleIds, onCheckout }: { bundleIds: readonly string[]; onCheckout?: () => void }) {
  const e = useCartEstimate(bundleIds);
  const row = "flex justify-between gap-4 text-body";
  return (
    <div className="space-y-2.5">
      <dl className="space-y-2">
        <div className={row}><dt className="text-ink-soft">{cartCopy.subtotal}</dt><dd className="tabular-nums">{formatPrice(e.subtotal)}</dd></div>
        {e.bundleDiscount > 0 && (
          <div className={row}><dt className="text-ink-soft">{cartCopy.bundleDiscount}</dt><dd className="tabular-nums text-success">−{formatPrice(e.bundleDiscount)}</dd></div>
        )}
        <div className={row}><dt className="text-ink-soft">{cartCopy.shipping}</dt><dd className="tabular-nums">{e.shipping ? formatPrice(e.shipping) : cartCopy.free}</dd></div>
        <div className={clsx(row, "border-t border-line pt-3 text-body-lg font-semibold")}><dt>{cartCopy.total}</dt><dd className="tabular-nums">{formatPrice(e.total)}</dd></div>
      </dl>
      <p className="text-micro text-ink-soft">{cartCopy.taxNote}</p>
      <ButtonLink href="/checkout" full size="lg" onClick={onCheckout}>{cartCopy.checkout} · {formatPrice(e.total)}</ButtonLink>
    </div>
  );
}

export function CouponForm() {
  const coupon = useCart((s) => s.coupon);
  const setCoupon = useCart((s) => s.setCoupon);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) return;
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/cart/coupon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: value }) });
      const json: unknown = await res.json().catch(() => null);
      const ok = res.ok && typeof json === "object" && json !== null && "ok" in json && json.ok === true;
      if (!ok) throw new Error();
      setCoupon(value);
      setCode("");
      toast.success(cartCopy.couponApplied(value));
    } catch {
      setError(cartCopy.couponFailed);
    } finally {
      setLoading(false);
    }
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-sm border border-dashed border-line px-3 py-2.5 text-meta">
        <span><span className="font-semibold">{coupon}</span> · {cartCopy.couponNote}</span>
        <button type="button" className="min-h-11 underline underline-offset-4" onClick={() => setCoupon(undefined)}>{cartCopy.couponRemove}</button>
      </div>
    );
  }
  return (
    <form onSubmit={apply} noValidate>
      <label htmlFor="coupon" className="text-meta font-medium">{cartCopy.couponLabel}</label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="coupon" value={code} onChange={(e) => setCode(e.target.value)} placeholder={cartCopy.couponPlaceholder} autoComplete="off"
          aria-invalid={!!error} aria-describedby={error ? "coupon-err" : undefined}
          className={clsx("h-11 min-w-0 flex-1 rounded-pill border bg-surface px-4 text-body uppercase placeholder:normal-case placeholder:text-ink-muted focus:border-ink focus:outline-none", error ? "border-danger" : "border-line")}
        />
        <Button type="submit" variant="secondary" loading={loading}>{cartCopy.couponApply}</Button>
      </div>
      {error && <p id="coupon-err" role="alert" className="mt-1.5 text-meta text-danger">⚠ {error}</p>}
    </form>
  );
}

export function CrossSells({ products, onNavigate }: { products: Product[]; onNavigate?: () => void }) {
  if (!products.length) return null;
  return (
    <section aria-labelledby="xsell">
      <h3 id="xsell" className="t-overline text-ink-soft">{cartCopy.crossSells}</h3>
      <ul className="mt-3 grid grid-cols-3 gap-3">
        {products.slice(0, 3).map((p) => (
          <li key={p.id}>
            <Link href={`/products/${p.slug}`} onClick={onNavigate} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-surface-warm">
                <Image src={p.images[0].url} alt={p.images[0].alt} fill sizes="120px" className="object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <p className="mt-1.5 truncate text-meta font-medium">{p.name}</p>
              <p className="text-micro text-ink-soft">{formatPrice(p.priceFrom)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
