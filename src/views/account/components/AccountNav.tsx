"use client";

import { clsx } from "clsx";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { accountNav } from "@/data/account";
import { signOut } from "@/views/auth/actions";

/** Account sub-nav: horizontal scroller on mobile, vertical rail on desktop. */
export function AccountNav() {
  const path = usePathname();
  const isActive = (href: string) => (href === "/account" ? path === href : path.startsWith(href));
  return (
    <nav aria-label="Account" className="-mx-[var(--gutter)] overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {accountNav.map((n) => (
          <li key={n.href}>
            <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined}
              className={clsx(
                "flex min-h-11 items-center whitespace-nowrap rounded-pill px-4 text-body lg:rounded-sm",
                isActive(n.href) ? "bg-ink text-on-dark" : "text-ink-soft hover:bg-surface-warm hover:text-ink",
              )}>
              {n.label}
            </Link>
          </li>
        ))}
        <li>
          <form action={signOut}>
            <button type="submit" className="flex min-h-11 items-center gap-2 whitespace-nowrap rounded-pill px-4 text-body text-ink-soft hover:bg-surface-warm hover:text-ink lg:w-full lg:rounded-sm">
              <LogOut className="size-4" aria-hidden /> Logout
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
