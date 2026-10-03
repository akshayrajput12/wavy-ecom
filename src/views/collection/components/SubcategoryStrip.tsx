import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { collectionCopy } from "@/data/storefront";
import type { Category, CategoryRef } from "@/types/domain";

export interface SubcategoryStripProps {
  /** Department the strip belongs to: the page itself on a parent page, the parent on a child page. */
  parent: CategoryRef;
  items: Pick<Category, "id" | "name" | "slug" | "image">[];
  /** Page being viewed; equals `parent.id` on the parent page (the "All" pill is then current). */
  currentId: string;
}

const pill = "group inline-flex min-h-14 items-center gap-3 rounded-pill border py-1.5 pr-5 text-meta font-medium transition-colors duration-(--dur-fast) focus-visible:outline-offset-2";

/** Thumbnail disc: category photo, or a graphite monogram while photos are not uploaded yet. */
function Thumb({ name, image }: { name: string; image?: Category["image"] }) {
  return (
    <span aria-hidden className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-pill bg-linear-160 from-black-2 to-black font-display text-body font-heading-sm text-on-dark">
      {image?.url
        ? <Image src={image.url} alt="" fill sizes="44px" className="object-cover transition-[scale] duration-(--dur-slow) ease-out group-hover:scale-110" />
        : name.charAt(0)}
    </span>
  );
}

/**
 * Image pills for a department: "All <parent>" first, then every sub-category; the current page is filled ink.
 * Wraps on desktop, a snapping horizontal scroller (edge to edge) on mobile.
 */
export function SubcategoryStrip({ parent, items, currentId }: SubcategoryStripProps) {
  const links = [{ id: parent.id, name: collectionCopy.allIn(parent.name), slug: parent.slug, image: undefined }, ...items];
  const isChild = currentId !== parent.id;
  return (
    <nav aria-label={isChild ? collectionCopy.siblings(parent.name) : collectionCopy.subcategories} className="pt-8">
      <ul className="-mx-(--gutter) flex snap-x snap-mandatory scroll-px-(--gutter) gap-2 overflow-x-auto px-(--gutter) pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
        {links.map((s) => {
          const current = s.id === currentId;
          return (
            <li key={s.id} className="shrink-0 snap-start">
              <Link
                href={`/collections/${s.slug}`} aria-current={current ? "page" : undefined}
                className={clsx(pill, current ? "border-ink bg-ink text-canvas" : "border-line bg-canvas hover:border-ink", s.id === parent.id ? "pl-5" : "pl-1.5")}
              >
                {s.id !== parent.id && <Thumb name={s.name} image={s.image} />}
                {s.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
