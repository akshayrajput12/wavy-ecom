"use client";

import { ShoppingBag } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { cartCopy, checkoutCopy } from "@/data/copy";
import { useCart, useCartHydrated } from "@/stores/cart";
import { CheckoutFlow, type CheckoutProps } from "./CheckoutFlow";
import { co } from "./copy";

/** Waits for the persisted bag, then mounts the flow (so sessionStorage/localStorage reads never hit SSR). */
export function CheckoutView(props: CheckoutProps) {
  const hydrated = useCartHydrated();
  const empty = useCart((s) => s.lines.length === 0);

  if (!hydrated) {
    return (
      <div className="grid gap-4 py-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-12" aria-busy="true" aria-label={co.loading}>
        <div className="grid content-start gap-4"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-8" /><Skeleton className="h-64" /></div>
        <Skeleton className="hidden h-96 lg:block" />
      </div>
    );
  }
  if (empty) {
    return (
      <div className="py-16">
        <EmptyState icon={<ShoppingBag className="size-8" aria-hidden />} title={checkoutCopy.emptyTitle} body={checkoutCopy.emptyBody}
          action={<ButtonLink href="/">{cartCopy.continue}</ButtonLink>} />
      </div>
    );
  }
  return <CheckoutFlow {...props} />;
}
