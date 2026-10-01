"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { footerCopy, headerCopy } from "@/data/copy";
import type { NavLink } from "@/types/domain";
import { isActive, navRoots } from "./MegaMenu";
import { SearchBox } from "./SearchBox";

const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out
const list: Variants = { hide: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } };

/** Full-height sheet (<lg): search, large display-type links with a staggered rise, small secondary links. */
export function MobileMenu({ open, onClose, storeName, categories, collections, pathname }: {
  open: boolean; onClose: () => void; storeName: string; categories: NavLink[]; collections: NavLink[]; pathname: string;
}) {
  const reduce = useReducedMotion();
  const item: Variants = {
    hide: { opacity: 0, y: reduce ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5, ease: EASE_OUT } },
  };
  const secondary = [
    { label: headerCopy.account, href: "/account" },
    { label: headerCopy.wishlist, href: "/wishlist" },
    { label: footerCopy.track, href: "/track" },
    { label: footerCopy.faq, href: "/faq" },
    { label: footerCopy.blog, href: "/blog" },
  ];

  return (
    <Drawer open={open} onClose={onClose} side="right" title={storeName} className="max-w-none! sm:rounded-none!">
      <SearchBox onNavigate={onClose} />
      <nav id="mobile-menu" aria-label={headerCopy.mobileNav} className="mt-6" onClick={(e) => (e.target as HTMLElement).closest("a") && onClose()}>
        <motion.ul initial="hide" animate={open ? "show" : "hide"} variants={list}>
          {navRoots(categories, collections).map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <motion.li key={l.href} variants={item} className="border-b border-line">
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={clsx("flex min-h-16 items-center justify-between gap-4 font-display text-h1 font-semibold leading-none tracking-(--tracking-display)", active && "underline decoration-2 underline-offset-8")}
                >
                  {l.label}
                  <ArrowUpRight className="size-6 shrink-0" strokeWidth={1.5} aria-hidden />
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
        <motion.ul initial="hide" animate={open ? "show" : "hide"} variants={list} className="mt-8 grid grid-cols-2 gap-x-4">
          {secondary.map((n) => (
            <motion.li key={n.href} variants={item}>
              <Link href={n.href} className="t-overline inline-flex min-h-11 items-center text-ink-soft hover:text-ink">{n.label}</Link>
            </motion.li>
          ))}
        </motion.ul>
      </nav>
    </Drawer>
  );
}
