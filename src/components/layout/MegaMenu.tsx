import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { headerCopy } from "@/data/copy";
import { layoutCopy } from "@/data/storefront";
import type { NavLink } from "@/types/domain";

const MAX_ROOTS = 6;

/**
 * Desktop category mega-menu. CSS-only: opens on hover and on keyboard focus (focus-within),
 * each panel spans the header width and lists children with their own children.
 */
export function MegaMenu({ categories, collections }: { categories: NavLink[]; collections: NavLink[] }) {
  const items: NavLink[] = [
    ...categories.slice(0, MAX_ROOTS),
    ...(collections.length ? [{ label: headerCopy.collections, href: "/collections", children: collections }] : []),
  ];
  if (!items.length) return null;
  return (
    <nav aria-label="Primary" className="max-lg:hidden">
      <ul className="flex items-center gap-1">
        {items.map((root) => (
          <li key={root.href} className="group/nav">
            <Link href={root.href} className="inline-flex min-h-11 items-center gap-1 rounded-pill px-3 text-body font-medium transition-colors duration-(--dur-fast) hover:bg-ink/5">
              {root.label}
              {root.children?.length ? <ChevronDown className="size-3.5 transition-transform duration-(--dur-base) group-hover/nav:rotate-180" aria-hidden /> : null}
            </Link>
            {root.children?.length ? (
              <div className="invisible absolute inset-x-0 top-full -translate-y-1 border-b border-line-soft bg-canvas opacity-0 shadow-md transition-[opacity,translate,visibility] duration-(--dur-base) ease-soft group-focus-within/nav:visible group-focus-within/nav:translate-y-0 group-focus-within/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 group-hover/nav:opacity-100">
                <div className="container-x grid grid-cols-4 gap-x-8 gap-y-6 py-8 xl:grid-cols-5">
                  {root.children.map((child) => (
                    <div key={child.href}>
                      <Link href={child.href} className="text-body font-semibold hover:text-accent-deep">{child.label}</Link>
                      {child.children?.length ? (
                        <ul className="mt-2 space-y-1.5">
                          {child.children.map((g) => (
                            <li key={g.href}><Link href={g.href} className="text-meta text-ink-soft hover:text-ink">{g.label}</Link></li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))}
                  <Link href={root.href} className="self-start text-meta font-medium text-accent-deep underline underline-offset-4">
                    {layoutCopy.shopAll} {root.label}
                  </Link>
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
