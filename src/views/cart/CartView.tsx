"use client";

import { ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { ProductRail } from "@/components/commerce/ProductGrid";
import { CartLineRow, CartNudges, CartTotals, CouponForm } from "@/components/commerce/cart/CartParts";
import { cartCount, useCart } from "@/stores/cart";
import { cartCopy as c } from "@/data/content";
import type { Product } from "@/types/domain";

/** Screens 15/27 — full bag with coupon, totals, bundle nudge and cross-sells. */
export function CartView({ crossSells, bundleIds }: { crossSells: Product[]; bundleIds: string[] }) {
  const lines = useCart((s) => s.lines);
  const inBag = new Set(lines.map((l) => l.productId));

  return (
    <div className="container-x pb-24">
      <header className="flex items-end justify-between gap-4 border-b border-line py-10 lg:py-16">
        <h1 className="t-hero">{c.title} <span className="text-ink-soft">({cartCount(lines)})</span></h1>
        {lines.length > 0 && <ButtonLink href="/new-in" variant="link" className="max-sm:hidden">{c.continue}</ButtonLink>}
      </header>

      {lines.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={<ShoppingBag className="size-7" aria-hidden />} title={c.empty.title} body={c.empty.body} action={<ButtonLink href="/new-in">{c.emptyCta}</ButtonLink>} />
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-10">
          <ul className="divide-y divide-line border-b border-line lg:col-span-7">
            {lines.map((l) => <CartLineRow key={l.id} line={l} large />)}
          </ul>
          <aside className="lg:col-span-5 lg:col-start-8">
            <div className="space-y-6 rounded-md border border-line bg-surface p-6 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              <CartNudges bundleIds={bundleIds} />
              <CouponForm />
              <CartTotals bundleIds={bundleIds} />
            </div>
          </aside>
        </div>
      )}

      {crossSells.length > 0 && (
        <section className="mt-24 overflow-hidden">
          <h2 className="t-display mb-10">{c.crossSells}</h2>
          <ProductRail products={crossSells.filter((p) => !inBag.has(p.id))} />
        </section>
      )}
    </div>
  );
}
