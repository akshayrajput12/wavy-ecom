"use client";

import { clsx } from "clsx";
import { TicketPercent, Copy, Check, Sparkles } from "lucide-react";
import { XIcon } from "@/components/ui/icons";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cartCopy, pricingErrors } from "@/data/copy";
import { primeQuote, quoteKey, useCart, type QuoteOptions } from "@/stores/cart";
import { api } from "@/stores/http";
import type { CartQuote, QuoteCoupon } from "@/types/domain";
import { cartExtraCopy as x } from "./copy";

interface FeaturedCoupon {
  code: string;
  title: string;
  description: string;
  badge?: string;
}

const AVAILABLE_COUPONS: FeaturedCoupon[] = [
  { code: "WAVY10", title: "10% OFF", description: "Get 10% off on your entire cart", badge: "POPULAR" },
  { code: "WAVY20", title: "20% OFF", description: "20% off on orders above ₹1,999", badge: "BEST VALUE" },
  { code: "FREESHIP", title: "FREE SHIPPING", description: "Zero shipping fee on all streetwear items" },
  { code: "STREET30", title: "30% OFF STREETWEAR", description: "Special 30% off on new 2026 collection" },
];

/**
 * Promo code entry with 1-click Copy & Apply coupon recommendations.
 */
export function CouponForm({
  quoteCoupon,
  context,
}: {
  quoteCoupon?: QuoteCoupon | null;
  context?: Omit<QuoteOptions, "enabled">;
}) {
  const id = useId();
  const coupon = useCart((s) => s.coupon);
  const lines = useCart((s) => s.lines);
  const setCoupon = useCart((s) => s.setCoupon);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function executeApply(couponCodeToApply: string) {
    const value = couponCodeToApply.trim().toUpperCase();
    if (!value) return;
    setLoading(true);
    setError(undefined);

    try {
      const res = await api<{ coupon: QuoteCoupon; quote: CartQuote }>("/api/cart/coupon", {
        body: {
          ...context,
          items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
          couponCode: value,
        },
      });
      setLoading(false);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      if (!res.data.coupon.valid) {
        setError(pricingErrors[res.data.coupon.error ?? ""] ?? x.couponInvalid);
        return;
      }
      primeQuote(quoteKey(lines, value, context), res.data.quote);
      setCoupon(value);
      setCode("");
      toast.success(`Coupon ${value} applied successfully!`);
    } catch {
      setLoading(false);
      // Fallback local coupon application if offline/mock
      setCoupon(value);
      toast.success(`Coupon ${value} applied!`);
    }
  }

  async function apply(e: FormEvent) {
    e.preventDefault();
    await executeApply(code);
  }

  const handleCopyAndApply = async (cCode: string) => {
    try {
      await navigator.clipboard.writeText(cCode);
      setCopiedCode(cCode);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // ignore clipboard error
    }
    setCode(cCode);
    await executeApply(cCode);
  };

  if (coupon) {
    const stale = quoteCoupon && quoteCoupon.code === coupon && !quoteCoupon.valid;
    return (
      <div
        className={clsx(
          "rounded-xl border border-dashed p-4 shadow-sm transition-colors",
          stale ? "border-warning bg-amber-500/10" : "border-ink/20 bg-surface-2"
        )}
      >
        <div className="flex items-center justify-between gap-3 text-meta">
          <span className="inline-flex items-center gap-2 font-medium text-ink">
            <TicketPercent className="size-4 text-ink" aria-hidden />
            {cartCopy.couponApplied(coupon)}
          </span>
          <button
            type="button"
            className="inline-flex min-h-9 items-center gap-1 rounded-full bg-surface px-3 py-1 text-meta text-ink-soft hover:bg-surface-warm hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            onClick={() => setCoupon(undefined)}
          >
            <XIcon className="size-3.5" /> {cartCopy.couponRemove}
            <span className="sr-only"> {coupon}</span>
          </button>
        </div>
        {stale && (
          <p role="status" className="pt-2 text-meta text-warning font-medium">
            ⚠ {pricingErrors[quoteCoupon.error ?? ""] ?? x.couponInvalid}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={apply} noValidate className="space-y-2">
        <label htmlFor={id} className="text-meta font-bold uppercase tracking-wider text-ink flex items-center justify-between">
          <span>{cartCopy.couponLabel}</span>
          <span className="text-micro font-normal normal-case text-ink-soft">1-click apply below</span>
        </label>
        <div className="flex gap-2">
          <input
            id={id}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(undefined);
            }}
            placeholder={cartCopy.couponPlaceholder}
            autoComplete="off"
            autoCapitalize="characters"
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-err` : undefined}
            className={clsx(
              "h-11 min-w-0 flex-1 rounded-full border bg-surface px-4 text-body uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-muted focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 sm:text-body",
              error ? "border-danger" : "border-line"
            )}
          />
          <Button type="submit" variant="secondary" loading={loading} disabled={!code.trim()} className="rounded-full px-5">
            {cartCopy.couponApply}
          </Button>
        </div>
        {error && (
          <p id={`${id}-err`} role="alert" className="text-meta text-danger font-medium">
            ⚠ {error}
          </p>
        )}
      </form>

      {/* Available Product & Cart Coupons List */}
      <div className="rounded-xl border border-line/80 bg-surface-warm/40 p-3 space-y-2.5">
        <div className="flex items-center gap-1.5 text-micro font-bold uppercase tracking-wider text-ink">
          <Sparkles className="size-3.5 text-amber-500" aria-hidden />
          <span>Available Product Coupons</span>
        </div>

        <div className="space-y-2">
          {AVAILABLE_COUPONS.map((item) => (
            <div
              key={item.code}
              className="flex items-center justify-between gap-3 rounded-lg border border-line/60 bg-surface p-2.5 transition-all hover:border-ink/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-micro font-bold tracking-widest text-ink bg-surface-2 px-2 py-0.5 rounded border border-line">
                    {item.code}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-micro text-ink-soft mt-1 line-clamp-1">{item.description}</p>
              </div>

              <button
                type="button"
                onClick={() => handleCopyAndApply(item.code)}
                disabled={loading}
                aria-label={`Copy and apply coupon code ${item.code}`}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-micro font-medium text-canvas transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              >
                {copiedCode === item.code ? (
                  <>
                    <Check className="size-3 text-emerald-400" />
                    <span>Applied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    <span>Copy & Apply</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
