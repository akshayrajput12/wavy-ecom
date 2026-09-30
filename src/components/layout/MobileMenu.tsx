"use client";

import Link from "next/link";
import { Drawer } from "@/components/ui/Drawer";
import { Accordion } from "@/components/ui/Controls";
import { footerCopy, headerCopy } from "@/data/copy";
import { layoutCopy } from "@/data/storefront";
import type { NavLink } from "@/types/domain";

export function MobileMenu({ open, onClose, storeName, categories, collections }: {
  open: boolean; onClose: () => void; storeName: string; categories: NavLink[]; collections: NavLink[];
}) {
  const link = "block py-2 text-body-lg text-ink-soft hover:text-ink";
  return (
    <Drawer open={open} onClose={onClose} side="left" title={storeName}>
      <nav aria-label="Mobile" onClick={(e) => (e.target as HTMLElement).closest("a") && onClose()}>
        {categories.map((c) =>
          c.children?.length ? (
            <Accordion key={c.href} title={c.label} name="mobile-nav">
              <ul>
                <li><Link href={c.href} className={link}>{layoutCopy.shopAll} {c.label}</Link></li>
                {c.children.map((ch) => <li key={ch.href}><Link href={ch.href} className={link}>{ch.label}</Link></li>)}
              </ul>
            </Accordion>
          ) : (
            <Link key={c.href} href={c.href} className="flex min-h-14 items-center border-b border-line text-body-lg font-medium">{c.label}</Link>
          ),
        )}
        {collections.length > 0 && (
          <Accordion title={headerCopy.collections} name="mobile-nav">
            <ul>{collections.map((c) => <li key={c.href}><Link href={c.href} className={link}>{c.label}</Link></li>)}</ul>
          </Accordion>
        )}
        <ul className="mt-6 space-y-1">
          {[
            { label: headerCopy.wishlist, href: "/wishlist" },
            { label: headerCopy.account, href: "/account" },
            { label: footerCopy.blog, href: "/blog" },
            { label: footerCopy.faq, href: "/faq" },
          ].map((n) => <li key={n.href}><Link href={n.href} className={link}>{n.label}</Link></li>)}
        </ul>
      </nav>
    </Drawer>
  );
}
