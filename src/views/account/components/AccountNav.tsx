"use client";

import { clsx } from "clsx";
import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { accountNav } from "@/data/copy";
import { ac } from "../copy";
import { signOut } from "@/views/auth/actions";

/** Account sub-nav: horizontal scroller on mobile, vertical rail on desktop. */
export function AccountNav({ isStaff }: { isStaff?: boolean }) {
  const path = usePathname();
  const isActive = (href: string) => (href === "/account" ? path === href : path.startsWith(href));
  return (
    <nav aria-label="Account" className="-mx-(--gutter) overflow-x-auto px-(--gutter) lg:mx-0 lg:px-0">
      <p className="t-overline mb-4 hidden lg:block">{ac.overline}</p>
      <ul className="flex gap-1 lg:flex-col lg:border-t lg:border-line lg:pt-4">
        {accountNav.map((n) => (
          <li key={n.href}>
            <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined}
              className={clsx(
                "flex min-h-11 items-center whitespace-nowrap rounded-pill border px-4 text-body transition-colors",
                isActive(n.href) ? "border-ink bg-ink text-canvas" : "border-line text-ink-soft hover:border-ink hover:text-ink lg:border-transparent lg:hover:border-line",
              )}>
              {n.label}
            </Link>
          </li>
        ))}
        {isStaff && (
          <li>
            <Link href="/admin/dashboard" className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-pill px-4 text-body font-medium text-ink hover:bg-surface-warm">
              <LayoutDashboard className="size-4" aria-hidden /> Admin dashboard
            </Link>
          </li>
        )}
        <li>
          <form action={signOut}>
            <button type="submit" className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-pill px-4 text-body text-ink-soft hover:bg-surface-warm hover:text-ink lg:w-full">
              <LogOut className="size-4" aria-hidden /> {ac.auth.logout}
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
