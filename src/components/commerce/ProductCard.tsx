import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { Sparkles } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/Badge";
import type { Product } from "@/types/domain";
import { PriceTag } from "./PriceTag";
import { RatingStars } from "./RatingStars";
import { WishlistButton } from "./WishlistButton";

const BADGE_TONE: Record<string, Tone> = { New: "dark", Limited: "dark", Sale: "accent" };

export const swatchesOf = (p: Product) => [...new Map(p.variants.map((v) => [v.color, v.colorHex])).entries()];
export const stockOf = (p: Product) => p.variants.reduce((n, v) => n + v.stock, 0);

export function ProductCard({ product: p, sizes = "(min-width: 1024px) 25vw, 50vw", priority, className }: { product: Product; sizes?: string; priority?: boolean; className?: string }) {
  const stock = stockOf(p);
  const swatches = swatchesOf(p);
  const href = `/products/${p.slug}`;
  return (
    <article className={clsx("group relative", className)}>
      <Link href={href} className="block rounded-md focus-visible:outline-offset-4">
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-warm">
          <Image
            src={p.images[0].url} alt={p.images[0].alt} fill sizes={sizes} priority={priority}
            className={clsx("object-cover transition duration-700 ease-out group-hover:scale-[1.03]", stock === 0 && "opacity-60")}
          />
          {p.images[1] && (
            <Image src={p.images[1].url} alt="" fill sizes={sizes} className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          )}
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            {stock === 0 ? <Badge tone="dark">Sold out</Badge> : p.badges.slice(0, 1).map((b) => <Badge key={b} tone={BADGE_TONE[b] ?? "neutral"}>{b}</Badge>)}
          </div>
          {p.tryOnEnabled && stock > 0 && (
            <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-pill bg-surface/85 px-2.5 py-1 text-micro font-medium backdrop-blur-sm">
              <Sparkles className="size-3" aria-hidden /> Try-on
            </span>
          )}
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-body font-medium">{p.name}</h3>
            <p className="truncate text-meta text-ink-soft">{p.descriptor}</p>
          </div>
          <PriceTag price={p.priceFrom} compareAt={p.compareAtFrom} className="shrink-0 justify-end text-right" />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            {swatches.slice(0, 4).map(([name, hex]) => (
              <span key={name} title={name} className="size-3 rounded-full border border-ink/15" style={{ backgroundColor: hex }} />
            ))}
            <span className="sr-only">{swatches.length} colours: {swatches.map(([n]) => n).join(", ")}</span>
            {swatches.length > 4 && <span className="text-micro text-ink-soft">+{swatches.length - 4}</span>}
          </span>
          {stock > 0 && stock <= 12 ? <span className="text-micro font-medium text-warning">Few left</span> : <RatingStars rating={p.rating} count={p.reviewCount} />}
        </div>
      </Link>
      <WishlistButton productId={p.id} name={p.name} className="absolute right-2 top-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 md:aria-pressed:opacity-100" />
    </article>
  );
}
