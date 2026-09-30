"use client";

import { ShoppingBag } from "lucide-react";
import { CartLines, CartNudges, CartTotals } from "@/components/commerce/cart/CartParts";
import { CouponForm } from "@/components/commerce/cart/CouponForm";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { cartCopy as c } from "@/data/copy";
import { cartCount, useCart, useCartHydrated, useCartQuote } from "@/stores/cart";

/** Full bag page: same parts as the drawer, laid out with a sticky summary. */
export function CartView({ freeShippingThreshold }: { freeShippingThreshold?: number }) {
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);
  const q = useCartQuote();

  return (
    <div className="container-x pb-24">
      <header className="flex items-end justify-between gap-4 border-b border-line py-8 lg:py-12">
        <h1 className="t-h1">{c.title} {hydrated && <span className="font-normal text-ink-soft">({cartCount(lines)})</span>}</h1>
        {lines.length > 0 && <ButtonLink href="/" variant="link" className="max-sm:hidden">{c.continue}</ButtonLink>}
      </header>

      {!hydrated ? (
        <div className="mt-8 grid gap-4" aria-busy="true"><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      ) : lines.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={<ShoppingBag className="size-7" aria-hidden />} title={c.empty.title} body={c.empty.body} action={<ButtonLink href="/">{c.emptyCta}</ButtonLink>} />
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-4 lg:col-span-7">
            <CartNudges q={q} freeShippingThreshold={freeShippingThreshold} />
            <CartLines q={q} large />
          </div>
          <aside className="lg:col-span-5">
            <div className="space-y-5 rounded-lg border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              <CouponForm quoteCoupon={q.quote?.coupon} />
              <CartTotals q={q} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
