"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { ProductCard } from "@/components/commerce/ProductCard";
import { addToBag } from "@/components/commerce/addToBag";
import { inStock } from "@/components/commerce/variantSelect";
import { useWishlist } from "@/stores/wishlist";
import { wishlistCopy as c } from "@/data/copy";
import type { Product } from "@/types/domain";
import { resolveWishlist } from "./actions";

const unsave = (productId: string) => {
  useWishlist.getState().remove(productId);
  void fetch("/api/account/wishlist", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId }) }).catch(() => undefined);
};

/** Account wishlist (server) merged with this device's saved ids (resolved via a server action). */
export function WishlistView({ signedIn, accountProducts }: { signedIn: boolean; accountProducts: Product[] }) {
  const ids = useWishlist((s) => s.ids);
  const [local, setLocal] = useState<Product[] | null>(null);
  const [removed, setRemoved] = useState<string[]>([]);

  useEffect(() => { void useWishlist.persist.rehydrate(); }, []);
  useEffect(() => {
    const missing = ids.filter((id) => !accountProducts.some((p) => p.id === id));
    let live = true;
    resolveWishlist(missing).then((r) => live && setLocal(r), () => live && setLocal([]));
    return () => { live = false; };
  }, [ids, accountProducts]);

  const products = useMemo(
    () => [...new Map([...accountProducts, ...(local ?? [])].map((p) => [p.id, p])).values()].filter((p) => !removed.includes(p.id) && (ids.includes(p.id) || accountProducts.includes(p))),
    [accountProducts, local, removed, ids],
  );
  const remove = (id: string) => { unsave(id); setRemoved((r) => [...r, id]); };

  return (
    <div className="container-x pb-24">
      <header className="border-b border-line pb-8 pt-8 lg:pb-10 lg:pt-12">
        <h1 className="t-display">{c.title} {local !== null && <span className="t-index align-top text-ink-soft">({String(products.length).padStart(2, "0")})</span>}</h1>
        {!signedIn && <p className="mt-3 text-body-lg text-ink-soft">{c.guestNote}</p>}
      </header>
      {local === null ? (
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4" aria-busy>
          {Array.from({ length: 4 }, (_, i) => <li key={i}><Skeleton className="aspect-[4/5] w-full rounded-lg" /><Skeleton className="mt-3 h-4 w-3/4" /></li>)}
        </ul>
      ) : products.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={<Heart className="size-7" aria-hidden />} title={c.empty.title} body={c.empty.body} action={<ButtonLink href="/collections">{c.emptyCta}</ButtonLink>} />
        </div>
      ) : (
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => <WishlistItem key={p.id} product={p} onRemove={() => remove(p.id)} />)}
        </ul>
      )}
    </div>
  );
}

function WishlistItem({ product: p, onRemove }: { product: Product; onRemove: () => void }) {
  const available = p.variants.filter(inStock);
  const [variantId, setVariantId] = useState(available[0]?.id ?? "");
  const moveToBag = () => {
    const v = available.find((x) => x.id === variantId);
    if (!v) return;
    addToBag(p, v);
    onRemove();
  };
  return (
    <li className="flex flex-col gap-3">
      <ProductCard product={p} sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" />
      {available.length > 1 && (
        <>
          <label htmlFor={`w-${p.id}`} className="sr-only">{p.optionNames.join(" / ")}</label>
          <select id={`w-${p.id}`} value={variantId} onChange={(e) => setVariantId(e.target.value)}
            className="h-11 w-full min-w-0 rounded-pill border border-line bg-transparent px-4 text-meta font-medium focus:border-ink focus:outline-none">
            {available.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
          </select>
        </>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {available.length > 0 ? <Button size="sm" className="h-11 flex-1" onClick={moveToBag}>{c.moveToBag}</Button> : <span className="inline-flex flex-1 items-center gap-2 text-meta font-medium text-danger"><span className="size-1.5 rounded-pill bg-current" aria-hidden />{c.soldOut}</span>}
        <button type="button" onClick={onRemove} className="min-h-11 text-meta text-ink-soft underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink">
          {c.remove}<span className="sr-only"> {p.name}</span>
        </button>
      </div>
    </li>
  );
}
