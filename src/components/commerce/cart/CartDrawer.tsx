"use client";

import { ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { EmptyState } from "@/components/ui/States";
import { cartCopy } from "@/data/copy";
import { cartCount, useCart, useCartHydrated, useCartQuote } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { CartLines, CartNudges, CartTotals } from "./CartParts";
import { CouponForm } from "./CouponForm";

/**
 * Global bag slider (right edge). Mount once per layout; `useCart().add()` opens it.
 * Quotes only while open. `freeShippingThreshold` = store_settings.freeShippingThreshold (paise).
 */
export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold?: number }) {
  const open = useCart((s) => s.open);
  const lines = useCart((s) => s.lines);
  const close = () => useCart.getState().setOpen(false);
  const pathname = usePathname();
  useCartHydrated();
  const q = useCartQuote({ enabled: open });

  useEffect(() => { void useWishlist.persist.rehydrate(); }, []);
  useEffect(() => { useCart.getState().setOpen(false); }, [pathname]);

  return (
    <Drawer
      open={open}
      onClose={close}
      title={<>{cartCopy.title} <span className="font-normal text-ink-soft">({cartCount(lines)})</span></>}
      footer={lines.length > 0 && <CartTotals q={q} onCheckout={close} />}
    >
      {lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-7" aria-hidden />}
          title={cartCopy.empty.title}
          body={cartCopy.empty.body}
          action={<ButtonLink href="/" onClick={close}>{cartCopy.emptyCta}</ButtonLink>}
        />
      ) : (
        <div className="space-y-5">
          <CartNudges q={q} freeShippingThreshold={freeShippingThreshold} />
          <CartLines q={q} onNavigate={close} />
          <CouponForm quoteCoupon={q.quote?.coupon} />
          <ButtonLink href="/cart" variant="link" onClick={close}>{cartCopy.viewBag}</ButtonLink>
        </div>
      )}
    </Drawer>
  );
}
