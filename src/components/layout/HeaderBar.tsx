"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { layoutCopy } from "@/data/storefront";
import type { NavLink } from "@/types/domain";
import { HeaderActions } from "./HeaderActions";
import { Logo } from "./Logo";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";
import { SearchBox } from "./SearchBox";
import { useHeaderScroll } from "./useHeaderScroll";

export interface HeaderProps {
  storeName: string; logoUrl?: string; logoDarkUrl?: string; categories: NavLink[]; collections: NavLink[]; isStaff?: boolean;
}

const EASE_SOFT = [0.32, 0.72, 0, 1] as const; // mirrors --ease-soft

/**
 * Floating pill nav, fixed and out of flow (pages offset themselves by --header-h, see StoreMain; home's
 * hero sits underneath). Turns dark-glass while a `.on-dark` stage is beneath it. The logo is not an h1.
 */
export function HeaderBar({ storeName, logoUrl, logoDarkUrl, categories, collections, isStaff }: HeaderProps) {
  const pathname = usePathname();
  const pill = useRef<HTMLDivElement>(null);
  // SSR guess (home opens on its dark hero) until the first scroll probe measures it
  const { hidden, dark, show } = useHeaderScroll(pill, pathname === "/", pathname);
  const reduce = useReducedMotion();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden && !reduce ? "-110%" : 0 }}
        transition={{ duration: 0.32, ease: EASE_SOFT }}
        onFocusCapture={show}
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-(--header-h) pt-3"
      >
        <div className="container-x">
          <div
            ref={pill}
            className={clsx(
              "pointer-events-auto relative flex h-14 items-center gap-3 rounded-pill border border-line pl-3 pr-2 shadow-sm backdrop-blur-md sm:pl-4",
              "transition-[background-color,border-color,color] duration-(--dur-base) ease-soft",
              dark ? "on-dark bg-black/40" : "bg-surface/80 text-ink",
            )}
          >
            <div className="flex min-w-0 flex-1"><Logo storeName={storeName} logoUrl={logoUrl} logoDarkUrl={logoDarkUrl} dark={dark} /></div>
            <MegaMenu categories={categories} collections={collections} pathname={pathname} />
            <HeaderActions isStaff={isStaff} onSearch={() => setSearch(true)} onMenu={() => setMenu(true)} menuOpen={menu} />
          </div>
        </div>
      </motion.header>

      <MobileMenu open={menu} onClose={() => setMenu(false)} storeName={storeName} categories={categories} collections={collections} pathname={pathname} />
      <Modal open={search} onClose={() => setSearch(false)} title={layoutCopy.searchTitle} size="lg">
        {search && <SearchBox autoFocus large onNavigate={() => setSearch(false)} />}
      </Modal>
    </>
  );
}
