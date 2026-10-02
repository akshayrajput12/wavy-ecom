"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { motion, type Variants } from "framer-motion";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { footerCopy, headerCopy } from "@/data/copy";
import { layoutCopy, mobileMenuCopy } from "@/data/storefront";
import type { NavLink } from "@/types/domain";
import { isActive, navRoots } from "./MegaMenu";
import { SearchBox } from "./SearchBox";

const EASE_OUT = [0.22, 1, 0.36, 1] as const; // mirrors --ease-out
const list: Variants = { hide: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } } };

/**
 * Full-height sheet (<lg): search, large display-type links with a staggered rise, small secondary links.
 * Roots with children (departments, collections) get a chevron that expands their sub-links (single-open accordion).
 */
export function MobileMenu({ open, onClose, storeName, categories, collections, pathname }: {
  open: boolean; onClose: () => void; storeName: string; categories: NavLink[]; collections: NavLink[]; pathname: string;
}) {
  const reduce = useReducedMotion();
  const uid = useId();
  const [expanded, setExpanded] = useState<string | null>(null);
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
            const kids = !!l.children?.length;
            const open1 = expanded === l.href;
            const panel = `${uid}-sub-${l.href}`;
            return (
              <motion.li key={l.href} variants={item} className="border-b border-line">
                <div className="flex items-center gap-2">
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    className={clsx("flex min-h-16 flex-1 items-center justify-between gap-4 font-display text-h1 font-semibold leading-none tracking-(--tracking-display)", active && "underline decoration-2 underline-offset-8")}
                  >
                    {l.label}
                    {!kids && <ArrowUpRight className="size-6 shrink-0" strokeWidth={1.5} aria-hidden />}
                  </Link>
                  {kids && (
                    <button
                      type="button" aria-expanded={open1} aria-controls={panel} onClick={() => setExpanded(open1 ? null : l.href)}
                      aria-label={mobileMenuCopy.toggle(l.label)}
                      className="grid size-11 shrink-0 place-items-center rounded-pill border border-line transition-colors duration-(--dur-fast) hover:border-ink aria-expanded:border-ink aria-expanded:bg-ink aria-expanded:text-canvas"
                    >
                      <ChevronDown className={clsx("size-5 transition-transform duration-(--dur-base) ease-soft", open1 && "rotate-180")} aria-hidden />
                    </button>
                  )}
                </div>
                {kids && (
                  // grid-rows 0fr -> 1fr animates to content height natively; inert keeps collapsed links out of tab order
                  <div id={panel} inert={!open1} className={clsx("grid transition-[grid-template-rows] duration-(--dur-base) ease-soft motion-reduce:transition-none", open1 ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                    <ul className="overflow-hidden">
                      {l.children!.map((c) => (
                        <li key={c.href}>
                          <Link href={c.href} aria-current={isActive(pathname, c.href) ? "page" : undefined}
                            className="flex min-h-11 items-center text-body-lg text-ink-soft hover:text-ink aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:underline-offset-4">
                            {c.label}
                          </Link>
                        </li>
                      ))}
                      <li className="pb-4">
                        <Link href={l.href} className="t-overline inline-flex min-h-11 items-center underline underline-offset-4">{layoutCopy.shopAll} {l.label}</Link>
                      </li>
                    </ul>
                  </div>
                )}
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
