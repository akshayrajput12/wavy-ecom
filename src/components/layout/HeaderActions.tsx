"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { LayoutDashboard } from "lucide-react";
import { HeartIcon, MenuIcon, SearchIcon, ShoppingBagIcon, UserIcon } from "@/components/ui/icons";
import { cartCount, useCart, useCartHydrated } from "@/stores/cart";
import { headerCopy } from "@/data/copy";

// 40px circle, 44px hit area via the ::after overhang
const iconButton =
  "relative grid size-10 shrink-0 place-items-center rounded-pill border border-line transition-colors duration-(--dur-fast) hover:bg-ink/8 after:absolute after:-inset-0.5";

/** Right side of the pill: search, wishlist, admin (staff), account, bag; search + bag + menu below lg. */
export function HeaderActions({ isStaff, onSearch, onMenu, menuOpen }: {
  isStaff?: boolean; onSearch: () => void; onMenu: () => void; menuOpen: boolean;
}) {
  const count = useCart((s) => cartCount(s.lines));
  const openCart = useCart((s) => s.setOpen);
  const hydrated = useCartHydrated(); // bounce on real changes only, not on the localStorage restore
  const desk = clsx(iconButton, "max-lg:hidden");
  const stroke = 1.6;

  return (
    <div className="flex flex-1 items-center justify-end gap-1.5">
      <button type="button" className={iconButton} onClick={onSearch} aria-label={headerCopy.search}>
        <SearchIcon className="size-4.5" strokeWidth={stroke} />
      </button>
      <Link href="/wishlist" className={desk} aria-label={headerCopy.wishlist}>
        <HeartIcon className="size-4.5" strokeWidth={stroke} />
      </Link>
      {isStaff && (
        <Link href="/admin/dashboard" className={desk} aria-label={headerCopy.admin} title={headerCopy.admin}>
          <LayoutDashboard className="size-4.5" strokeWidth={stroke} aria-hidden />
        </Link>
      )}
      <Link href="/account" className={desk} aria-label={headerCopy.account}>
        <UserIcon className="size-4.5" strokeWidth={stroke} />
      </Link>
      <button type="button" className={iconButton} onClick={() => openCart(true)} aria-label={`${headerCopy.bag}, ${count}`}>
        <ShoppingBagIcon className="size-4.5" strokeWidth={stroke} trigger={hydrated ? count : undefined} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-pill bg-ink px-1 text-overline font-semibold leading-none text-canvas tabular-nums" aria-hidden>
            {count}
          </span>
        )}
      </button>
      <button
        type="button"
        className={clsx(iconButton, "lg:hidden")}
        onClick={onMenu}
        aria-label={headerCopy.menu}
        aria-expanded={menuOpen}
        aria-controls="mobile-menu"
      >
        <MenuIcon className="size-4.5" strokeWidth={stroke} open={menuOpen} />
      </button>
    </div>
  );
}
