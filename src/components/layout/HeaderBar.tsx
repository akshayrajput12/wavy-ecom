"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { Heart, LayoutDashboard, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { cartCount, useCart } from "@/stores/cart";
import { headerCopy } from "@/data/copy";
import { layoutCopy } from "@/data/storefront";
import type { NavLink } from "@/types/domain";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { SearchBox } from "./SearchBox";

export interface HeaderProps { storeName: string; categories: NavLink[]; collections: NavLink[]; isStaff?: boolean }

/** Hides while scrolling down, returns on the slightest scroll up. */
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last.current;
      if (Math.abs(delta) > 6) setHidden(delta > 0 && y > 160);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return hidden;
}

export function HeaderBar({ storeName, categories, collections, isStaff }: HeaderProps) {
  const hidden = useHideOnScroll();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const count = useCart((s) => cartCount(s.lines));
  const setOpen = useCart((s) => s.setOpen);
  const icon = "relative grid size-11 place-items-center rounded-pill transition-colors duration-(--dur-fast) hover:bg-ink/5";

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 border-b border-line-soft bg-canvas/90 backdrop-blur-md transition-transform duration-(--dur-base) ease-soft",
        hidden && "-translate-y-full focus-within:translate-y-0",
      )}
    >
      <div className="container-x flex h-(--header-h) items-center gap-2 lg:gap-8">
        <button type="button" className={clsx(icon, "-ml-2.5 lg:hidden")} onClick={() => setMenu(true)} aria-label={headerCopy.menu}>
          <Menu className="size-5" aria-hidden />
        </button>
        <Link href="/" className="font-serif text-h1 leading-none tracking-tight max-lg:flex-1 max-lg:text-center" aria-label={layoutCopy.home(storeName)}>
          {storeName}
        </Link>
        <MegaMenu categories={categories} collections={collections} />
        <div className="-mr-2.5 flex items-center justify-end lg:ml-auto">
          <button type="button" className={icon} onClick={() => setSearch(true)} aria-label={headerCopy.search}>
            <Search className="size-5" strokeWidth={1.6} aria-hidden />
          </button>
          <Link href="/wishlist" className={clsx(icon, "max-sm:hidden")} aria-label={headerCopy.wishlist}><Heart className="size-5" strokeWidth={1.6} aria-hidden /></Link>
          {isStaff && (
            <Link href="/admin/dashboard" className={clsx(icon, "max-sm:hidden")} aria-label="Admin dashboard" title="Admin dashboard">
              <LayoutDashboard className="size-5" strokeWidth={1.6} aria-hidden />
            </Link>
          )}
          <Link href="/account" className={clsx(icon, "max-sm:hidden")} aria-label={headerCopy.account}><User className="size-5" strokeWidth={1.6} aria-hidden /></Link>
          <button type="button" className={icon} onClick={() => setOpen(true)} aria-label={`${headerCopy.bag}, ${count}`}>
            <ShoppingBag className="size-5" strokeWidth={1.6} aria-hidden />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-pill bg-accent px-1 text-micro font-semibold leading-none text-ink tabular-nums" aria-hidden>
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <MobileMenu open={menu} onClose={() => setMenu(false)} storeName={storeName} categories={categories} collections={collections} />
      <Modal open={search} onClose={() => setSearch(false)} title={layoutCopy.searchTitle} size="lg">
        {search && <SearchBox autoFocus large onNavigate={() => setSearch(false)} />}
      </Modal>
    </header>
  );
}
