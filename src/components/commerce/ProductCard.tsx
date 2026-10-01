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
import { totalStock } from "./variantSelect";

const fade = "transition-[opacity,scale] duration-500 ease-soft";

/**
 * Product card (reference "Team favourites"): tall stone well with a chip, hover zoom + second-image cross-fade,
 * name / rating / "From" price, and a black circular quick-add button. One stretched link covers the card;
 * the heart and quick-add are separate buttons layered above it (no nested interactive elements).
 */
export function ProductCard({ product: p, sizes = "(min-width: 1024px) 25vw, 50vw", preload, className }: {
  product: Product; sizes?: string; preload?: boolean; className?: string;
}) {
  const soldOut = totalStock(p) === 0;
  const [first, second] = p.images;
  const chip = soldOut ? productCopy.soldOut : (p.badges[0] ?? p.category?.name);
  const ranged = new Set(p.variants.map((v) => v.price)).size > 1;

  return (
    <article className={clsx("group relative flex h-full flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-2">
        <ImageWell media={first} alt={first?.alt || p.name} sizes={sizes} preload={preload} className="absolute! inset-0"
          imgClassName={clsx(fade, "group-hover:scale-[1.04]", second?.url && "md:group-hover:opacity-0", soldOut && "opacity-60")} />
        {second?.url && (
          <ImageWell media={second} alt="" sizes={sizes} className="absolute! inset-0 bg-transparent! opacity-0 transition-opacity duration-500 ease-soft max-md:hidden md:group-hover:opacity-100"
            imgClassName={clsx(fade, "group-hover:scale-[1.04]")} />
        )}
        <span className="pointer-events-none absolute inset-0 bg-ink opacity-0 transition-opacity duration-500 ease-soft group-hover:opacity-[0.04]" aria-hidden />
        {chip && <Badge tone={soldOut ? "dark" : "outline"} className="pointer-events-none absolute left-3 top-3 max-w-[calc(100%-4.5rem)] truncate">{chip}</Badge>}
        <WishlistButton productId={p.id} name={p.name}
          className="absolute right-2 top-2 z-10 transition-opacity duration-(--dur-base) pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100 aria-pressed:opacity-100" />
      </div>

      <div className="mt-3 flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-meta font-medium text-ink sm:text-body">
            <Link href={`/products/${p.slug}`}
              className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-focus">
              {p.name}
            </Link>
          </h3>
          {p.reviewCount > 0 && <RatingStars rating={p.rating} count={p.reviewCount} outOf />}
          <PriceTag price={p.priceFrom} compareAt={p.compareAtFrom} from={ranged} />
        </div>
        <QuickViewButton product={p} className="relative z-10 -mr-1 mt-1 shrink-0" />
      </div>
    </article>
  );
}
