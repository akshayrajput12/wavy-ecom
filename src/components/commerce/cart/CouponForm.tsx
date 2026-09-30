"use client";

import { clsx } from "clsx";
import { TicketPercent, X } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cartCopy, pricingErrors } from "@/data/copy";
import { useCart, type QuoteOptions } from "@/stores/cart";
import { api } from "@/stores/http";
import type { CartQuote, QuoteCoupon } from "@/types/domain";
import { cartExtraCopy as x } from "./copy";

/**
 * Promo code entry. Validates via POST /api/cart/coupon (server decides eligibility) and stores the code;
 * the next quote then carries the discount. `quoteCoupon` surfaces a code that stopped applying (bag changed).
 */
export function CouponForm({ quoteCoupon, context }: { quoteCoupon?: QuoteCoupon | null; context?: Omit<QuoteOptions, "enabled"> }) {
  const id = useId();
  const coupon = useCart((s) => s.coupon);
  const lines = useCart((s) => s.lines);
  const setCoupon = useCart((s) => s.setCoupon);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function apply(e: FormEvent) {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!value) return;
    setLoading(true);
    setError(undefined);
    const res = await api<{ coupon: QuoteCoupon; quote: CartQuote }>("/api/cart/coupon", {
      body: { ...context, items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), couponCode: value },
    });
    setLoading(false);
    if (!res.ok) return setError(res.error.message);
    if (!res.data.coupon.valid) return setError(pricingErrors[res.data.coupon.error ?? ""] ?? x.couponInvalid);
    setCoupon(value);
    setCode("");
    toast.success(cartCopy.couponApplied(value));
  }

  if (coupon) {
    const stale = quoteCoupon && quoteCoupon.code === coupon && !quoteCoupon.valid;
    return (
      <div className={clsx("rounded-md border border-dashed px-3 py-2", stale ? "border-warning" : "border-accent-deep bg-accent-soft")}>
        <div className="flex items-center justify-between gap-3 text-meta">
          <span className="inline-flex items-center gap-2 font-medium"><TicketPercent className="size-4 text-accent-deep" aria-hidden /> {cartCopy.couponApplied(coupon)}</span>
          <button type="button" className="inline-flex min-h-11 items-center gap-1 rounded-pill px-2 text-ink-soft hover:text-ink" onClick={() => setCoupon(undefined)}>
            <X className="size-3.5" aria-hidden /> {cartCopy.couponRemove}<span className="sr-only"> {coupon}</span>
          </button>
        </div>
        {stale && <p role="status" className="pb-1 text-meta text-warning">⚠ {pricingErrors[quoteCoupon.error ?? ""] ?? x.couponInvalid}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={apply} noValidate>
      <label htmlFor={id} className="text-meta font-medium">{cartCopy.couponLabel}</label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={id} value={code} onChange={(e) => { setCode(e.target.value); setError(undefined); }} placeholder={cartCopy.couponPlaceholder}
          autoComplete="off" autoCapitalize="characters" aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
          className={clsx(
            "h-11 min-w-0 flex-1 rounded-pill border bg-surface px-4 text-body-lg uppercase placeholder:normal-case placeholder:text-ink-muted focus:border-ink focus:outline-none sm:text-body",
            error ? "border-danger" : "border-line",
          )}
        />
        <Button type="submit" variant="secondary" loading={loading} disabled={!code.trim()}>{cartCopy.couponApply}</Button>
      </div>
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-meta text-danger">⚠ {error}</p>}
    </form>
  );
}
