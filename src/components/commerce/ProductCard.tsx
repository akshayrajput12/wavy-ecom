import Link from "next/link";
import { clsx } from "clsx";
import { Badge } from "@/components/ui/Badge";
import { productCopy } from "@/data/copy";
import type { Product } from "@/types/domain";
import { ImageWell } from "./ImageWell";
import { PriceTag } from "./PriceTag";
import { QuickViewButton } from "./QuickView";
import { RatingStars } from "./RatingStars";
import { WishlistButton } from "./WishlistButton";
import { swatchesOf, totalStock } from "./variantSelect";

const MAX_SWATCHES = 5;

/** Generic product card for any category: second image on hover, soft lift, quick view, wishlist. */
export function ProductCard({ product: p, sizes = "(min-width: 1024px) 25vw, 50vw", preload, className }: {
  product: Product; sizes?: string; preload?: boolean; className?: string;
}) {
  const soldOut = totalStock(p) === 0;
  const swatches = swatchesOf(p).filter((s) => s.colorHex);
  const [first, second] = p.images;

  return (
    <article className={clsx("group relative flex h-full flex-col rounded-md", className)}>
      <div className="lift relative rounded-md">
        <Link href={`/products/${p.slug}`} className="block rounded-md focus-visible:outline-offset-4" aria-label={p.name}>
          <ImageWell media={first} alt={first?.alt || p.name} sizes={sizes} preload={preload} className="aspect-[4/5] rounded-md"
            imgClassName={clsx("transition-[opacity,scale] duration-(--dur-slow) ease-soft group-hover:scale-[1.02]", soldOut && "opacity-60")} />
          {second?.url && (
            <ImageWell media={second} alt="" sizes={sizes} className="pointer-events-none absolute! inset-0 rounded-md opacity-0 transition-opacity duration-(--dur-slow) ease-soft max-md:hidden md:group-hover:opacity-100" />
          )}
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {soldOut ? <Badge tone="dark">{productCopy.soldOut}</Badge> : p.badges.slice(0, 2).map((b) => <Badge key={b} tone="accent">{b}</Badge>)}
        </div>
        <WishlistButton productId={p.id} name={p.name} className="absolute right-2 top-2" />
        <QuickViewButton product={p} className="absolute bottom-2.5 right-2.5 md:left-1/2 md:right-auto md:-translate-x-1/2 md:translate-y-1 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:focus-visible:translate-y-0 md:focus-visible:opacity-100" />
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-1">
        {p.brand && <p className="truncate text-micro font-medium uppercase tracking-wide text-ink-soft">{p.brand}</p>}
        <h3 className="line-clamp-2 text-body font-medium">
          <Link href={`/products/${p.slug}`} tabIndex={-1} className="hover:underline hover:underline-offset-4">{p.name}</Link>
        </h3>
        {p.reviewCount > 0 && <RatingStars rating={p.rating} count={p.reviewCount} />}
        <PriceTag price={p.priceFrom} compareAt={p.compareAtFrom} className="mt-auto pt-1" />
        {swatches.length > 1 && (
          <p className="flex items-center gap-1.5 pt-1">
            {swatches.slice(0, MAX_SWATCHES).map((s) => (
              <span key={s.value} title={s.value} className="size-3.5 rounded-pill border border-ink/15" style={{ backgroundColor: s.colorHex }} aria-hidden />
            ))}
            {swatches.length > MAX_SWATCHES && <span className="text-micro text-ink-soft" aria-hidden>+{swatches.length - MAX_SWATCHES}</span>}
            <span className="sr-only">{swatches.map((s) => s.value).join(", ")}</span>
          </p>
        )}
      </div>
    </article>
  );
}
