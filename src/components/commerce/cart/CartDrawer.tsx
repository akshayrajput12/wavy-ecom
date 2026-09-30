"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { cartCount, useCart } from "@/stores/cart";
import { useWishlist } from "@/stores/wishlist";
import { cartCopy } from "@/data/content";
import type { Product } from "@/types/domain";
import { CartLineRow, CartNudges, CartTotals, CrossSells } from "./CartParts";

/** Global bag drawer (screen 14). Also rehydrates the persisted cart + wishlist once on mount. */
export function CartDrawer({ crossSells, bundleIds }: { crossSells: Product[]; bundleIds: string[] }) {
  const { lines, open, setOpen } = useCart();
  const close = () => setOpen(false);
  const pathname = usePathname();

  useEffect(() => {
    void useCart.persist.rehydrate();
    void useWishlist.persist.rehydrate();
  }, []);
  useEffect(() => { useCart.getState().setOpen(false); }, [pathname]);

  const inBag = new Set(lines.map((l) => l.productId));
  const count = cartCount(lines);

  return (
    <Drawer
      open={open}
      onClose={close}
      title={<>{cartCopy.title} <span className="text-ink-soft">({count})</span></>}
      footer={lines.length > 0 && <CartTotals bundleIds={bundleIds} onCheckout={close} />}
    >
      {lines.length === 0 ? (
        <div className="space-y-8">
          <EmptyState
            icon={<ShoppingBag className="size-7" aria-hidden />}
            title={cartCopy.empty.title}
            body={cartCopy.empty.body}
            action={<ButtonLink href="/new-in" onClick={close}>{cartCopy.emptyCta}</ButtonLink>}
          />
          <CrossSells products={crossSells} onNavigate={close} />
        </div>
      ) : (
        <div className="space-y-6">
          <CartNudges bundleIds={bundleIds} />
          <ul className="divide-y divide-line border-y border-line">
            {lines.map((l) => <CartLineRow key={l.id} line={l} />)}
          </ul>
          <ButtonLink href="/cart" variant="link" onClick={close}>{cartCopy.viewBag}</ButtonLink>
          <CrossSells products={crossSells.filter((p) => !inBag.has(p.id))} onNavigate={close} />
        </div>
      )}
    </Drawer>
  );
}
