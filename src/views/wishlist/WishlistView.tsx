"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { PriceTag } from "@/components/commerce/PriceTag";
import { useWishlist } from "@/stores/wishlist";
import { toCartLine, useCart } from "@/stores/cart";
import { wishlistCopy as c } from "@/data/content";
import type { Product } from "@/types/domain";

/** Screen 13. `products` is the catalogue the saved ids resolve against (guest wishlist lives in localStorage). */
export function WishlistView({ products }: { products: Product[] }) {
  const ids = useWishlist((s) => s.ids);
  const saved = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);

  return (
    <div className="container-x pb-24">
      <header className="border-b border-line py-10 lg:py-16">
        <h1 className="t-hero">{c.title} <span className="text-ink-soft">({saved.length})</span></h1>
        <p className="mt-3 text-body-lg text-ink-soft">{c.intro}</p>
      </header>
      {saved.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={<Heart className="size-7" aria-hidden />} title={c.empty.title} body={c.empty.body} action={<ButtonLink href="/new-in">{c.emptyCta}</ButtonLink>} />
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-5 md:grid-cols-3 lg:grid-cols-4">
          {saved.map((p) => <WishlistItem key={p.id} product={p} />)}
        </ul>
      )}
    </div>
  );
}

function WishlistItem({ product: p }: { product: Product }) {
  const inStock = p.variants.filter((v) => v.stock > 0);
  const [variantId, setVariantId] = useState(inStock[0]?.id ?? "");
  const remove = useWishlist((s) => s.remove);
  const add = useCart((s) => s.add);
  const setOpen = useCart((s) => s.setOpen);

  function moveToBag() {
    const v = inStock.find((x) => x.id === variantId);
    if (!v) return;
    add(toCartLine(p, v));
    remove(p.id);
    setOpen(true);
    toast.success(`${p.name} moved to your bag`);
  }

  return (
    <li className="flex flex-col">
      <Link href={`/products/${p.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-md bg-surface-warm">
        <Image src={p.images[0].url} alt={p.images[0].alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
        {!inStock.length && <span className="absolute left-2.5 top-2.5"><Badge tone="dark">{c.soldOut}</Badge></span>}
      </Link>
      <div className="mt-3 flex items-start justify-between gap-2">
        <Link href={`/products/${p.slug}`} className="min-w-0 truncate text-body font-medium hover:underline">{p.name}</Link>
        <PriceTag price={p.priceFrom} compareAt={p.compareAtFrom} className="shrink-0" />
      </div>
      {inStock.length > 0 && (
        <>
          <label htmlFor={`w-${p.id}`} className="sr-only">{c.chooseSize}</label>
          <select id={`w-${p.id}`} value={variantId} onChange={(e) => setVariantId(e.target.value)}
            className="mt-3 h-11 rounded-sm border border-line bg-surface px-3 text-meta focus:border-ink focus:outline-none">
            {inStock.map((v) => <option key={v.id} value={v.id}>{v.color} · {v.size}</option>)}
          </select>
        </>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
        {inStock.length > 0 && <Button size="sm" className="flex-1" onClick={moveToBag}>{c.moveToBag}</Button>}
        <button type="button" onClick={() => remove(p.id)} className="min-h-9 text-meta text-ink-soft underline underline-offset-4 hover:text-ink">
          {c.remove}<span className="sr-only"> {p.name}</span>
        </button>
      </div>
    </li>
  );
}
