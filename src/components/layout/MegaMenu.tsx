import Link from "next/link";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { headerCopy } from "@/data/copy";
import { layoutCopy } from "@/data/storefront";
import type { NavLink } from "@/types/domain";

const MAX_ROOTS = 5;

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** Top-level nav entries: DB category roots plus a Collections root when collections exist. */
export function navRoots(categories: NavLink[], collections: NavLink[]): NavLink[] {
  return [
    ...categories.slice(0, MAX_ROOTS),
    ...(collections.length ? [{ label: headerCopy.collections, href: "/collections", children: collections }] : []),
  ];
}

/**
 * Desktop nav: tiny uppercase labels in an inner pill group. Panels are CSS-only (hover + focus-within),
 * fading and rising into a rounded card below the floating pill (positioned against the pill).
 */
export function MegaMenu({ categories, collections, pathname }: { categories: NavLink[]; collections: NavLink[]; pathname: string }) {
  const items = navRoots(categories, collections);
  if (!items.length) return null;
  return (
    <nav aria-label={headerCopy.primaryNav} className="max-lg:hidden">
      <ul className="flex items-center gap-0.5 rounded-pill border border-line bg-canvas/40 p-1">
        {items.map((root) => {
          const active = isActive(pathname, root.href);
          return (
            <li key={root.href} className="group/nav">
              <Link
                href={root.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "t-overline relative inline-flex h-9 items-center gap-1 rounded-pill px-3.5 transition-colors duration-(--dur-fast) after:absolute after:inset-x-0 after:-inset-y-1 ",
                  active ? "bg-ink text-canvas" : "text-ink hover:bg-ink/8 group-focus-within/nav:bg-ink/8",
                )}
              >
                {root.label}
                {root.children?.length ? <ChevronDown className="size-3 transition-transform duration-(--dur-base) group-hover/nav:rotate-180" aria-hidden /> : null}
              </Link>
              {root.children?.length ? (
                <div className="invisible absolute inset-x-0 top-full translate-y-1 pt-2 opacity-0 transition-[opacity,translate,visibility] duration-(--dur-base) ease-out group-focus-within/nav:visible group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100">
                  <div className="grid grid-cols-4 gap-x-8 gap-y-6 rounded-lg border border-line bg-surface p-8 text-ink shadow-md xl:grid-cols-5">
                    {root.children.map((child) => (
                      <div key={child.href}>
                        <Link href={child.href} className="text-body font-semibold hover:underline hover:underline-offset-4">{child.label}</Link>
                        {child.children?.length ? (
                          <ul className="mt-2 space-y-1.5">
                            {child.children.map((g) => (
                              <li key={g.href}><Link href={g.href} className="text-meta text-ink-soft hover:text-ink">{g.label}</Link></li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ))}
                    <Link href={root.href} className="t-overline self-start text-ink underline underline-offset-4">
                      {layoutCopy.shopAll} {root.label}
                    </Link>
                  </div>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
