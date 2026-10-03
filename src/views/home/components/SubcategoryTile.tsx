import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import { homeCopy } from "@/data/storefront";
import { formatPrice } from "@/lib/format";
import type { CategoryOffer, SubcategoryTile as Tile } from "@/types/domain";

const zoom = "transition-[scale] duration-(--dur-slow) ease-out motion-safe:group-hover:scale-[1.05] motion-safe:group-focus-visible:scale-[1.05]";
const offerText = (o: CategoryOffer) => (o.kind === "discount" ? homeCopy.subcategories.upTo(o.pct) : homeCopy.subcategories.from(formatPrice(o.price)));

/** Sub-category tile: hairline card, rounded image well, display name, offer line, underlined "Shop now ›". One link. */
export function SubcategoryTile({ tile: t, sizes }: { tile: Tile; sizes: string }) {
  return (
    <Link
      href={`/collections/${t.slug}`}
      className="group flex h-full flex-col rounded-lg border border-line-soft bg-surface p-2 transition-[border-color,box-shadow] duration-(--dur-base) ease-soft hover:border-line hover:shadow-md focus-visible:outline-offset-4"
    >
      <span className="relative block aspect-[4/5] overflow-hidden rounded-md bg-surface-2">
        {t.image?.url ? (
          <Image src={t.image.url} alt="" fill sizes={sizes} className={`object-cover ${zoom}`} />
        ) : (
          // no photo yet: graphite stage + outlined monogram (as CategoryCard), so the tile reads as designed
          <span aria-hidden className={`absolute inset-0 grid place-items-center bg-linear-160 from-black-2 via-black to-black ${zoom}`}>
            <span className="font-display text-[5.5rem] font-heading leading-none text-transparent [-webkit-text-stroke:1px_color-mix(in_srgb,var(--on-dark)_30%,transparent)]">
              {t.name.charAt(0)}
            </span>
          </span>
        )}
      </span>
      <span className="flex flex-1 flex-col items-center px-1 pb-2 pt-3 text-center">
        <span className="line-clamp-2 font-display text-body-lg font-heading-sm leading-tight text-ink">{t.name}</span>
        {t.offer && <span className="mt-1 font-display text-h3 font-heading leading-tight tracking-tight text-ink">{offerText(t.offer)}</span>}
        <span className="mt-auto inline-flex items-center gap-0.5 pt-2 text-meta font-medium text-ink-soft underline decoration-line underline-offset-4 transition-colors duration-(--dur-fast) group-hover:text-ink group-hover:decoration-ink">
          {homeCopy.shopNow}
          <ChevronRightIcon className="size-3.5" />
        </span>
      </span>
    </Link>
  );
}
