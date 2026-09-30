"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { clsx } from "clsx";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { cartCount, useCart } from "@/stores/cart";
import { headerCopy, mainNav } from "@/data/navigation";
import { site } from "@/data/site";

/** Pages whose first section is a full-bleed hero that sits under a transparent header. */
const HERO_ROUTES = ["/", "/editorial"];

const subscribe = (cb: () => void) => {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
};

export function Header() {
  const pathname = usePathname();
  const scrolled = useSyncExternalStore(subscribe, () => window.scrollY > 24, () => false);
  const [menu, setMenu] = useState(false);
  const count = useCart((s) => cartCount(s.lines));
  const setOpen = useCart((s) => s.setOpen);
  const overlay = HERO_ROUTES.includes(pathname) && !scrolled;

  const icon = "grid size-11 place-items-center rounded-pill transition-colors hover:bg-ink/5";
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 h-(--header-h) transition-[background-color,color,border-color] duration-300",
        overlay ? "border-b border-transparent bg-transparent text-on-dark" : "border-b border-line bg-canvas/90 text-ink backdrop-blur-md",
      )}
    >
      <div className="container-x grid h-full grid-cols-[1fr_auto_1fr] items-center gap-4">
        <nav aria-label="Primary" className="flex items-center">
          <button type="button" className={clsx(icon, "-ml-2.5 lg:hidden")} onClick={() => setMenu(true)} aria-label={headerCopy.menu}>
            <Menu className="size-5" aria-hidden />
          </button>
          <ul className="hidden items-center gap-7 lg:flex">
            {mainNav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined}
                  className="relative py-2 text-body font-medium after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100 aria-[current=page]:after:scale-x-100">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/" className="font-serif text-[2rem] leading-none tracking-tight" aria-label={`${site.name} — home`}>
          {site.name}
        </Link>

        <div className="-mr-2.5 flex items-center justify-end">
          <Link href="/search" className={icon} aria-label={headerCopy.search}><Search className="size-5" strokeWidth={1.6} aria-hidden /></Link>
          <Link href="/wishlist" className={clsx(icon, "max-sm:hidden")} aria-label={headerCopy.wishlist}><Heart className="size-5" strokeWidth={1.6} aria-hidden /></Link>
          <Link href="/account" className={clsx(icon, "max-sm:hidden")} aria-label={headerCopy.account}><User className="size-5" strokeWidth={1.6} aria-hidden /></Link>
          <button type="button" className={clsx(icon, "relative")} onClick={() => setOpen(true)} aria-label={`${headerCopy.bag}, ${count} items`}>
            <ShoppingBag className="size-5" strokeWidth={1.6} aria-hidden />
            {count > 0 && (
              <span className="absolute right-1 top-1 grid min-w-4.5 place-items-center rounded-pill bg-accent px-1 text-[10px] font-semibold leading-4.5 text-ink tabular-nums" aria-hidden>
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      <Drawer open={menu} onClose={() => setMenu(false)} side="left" title={site.name}>
        <nav aria-label="Mobile">
          <ul className="space-y-1">
            {mainNav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setMenu(false)} className="block py-2 font-serif text-display leading-none">{n.label}</Link>
              </li>
            ))}
          </ul>
          <ul className="mt-10 space-y-3 border-t border-line pt-6 text-body-lg">
            {[...headerCopy.mobileExtra, { label: headerCopy.wishlist, href: "/wishlist" }, { label: headerCopy.account, href: "/account" }].map((n) => (
              <li key={n.href}><Link href={n.href} onClick={() => setMenu(false)} className="block py-1 text-ink-soft hover:text-ink">{n.label}</Link></li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </header>
  );
}
