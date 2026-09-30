"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";
import { Plus } from "lucide-react";
import { PriceTag } from "@/components/commerce/PriceTag";
import { home } from "@/data/home";
import type { Product } from "@/types/domain";

/** Shoppable look: hotspots on the image and the product list highlight each other. */
export function CompleteTheLook({ products }: { products: Product[] }) {
  const c = home.completeTheLook;
  const [active, setActive] = useState(0);
  const spots = c.items.map((it) => ({ ...it, product: products.find((p) => p.id === it.productId) })).filter((s) => s.product);

  return (
    <section className="container-x section-y grid gap-10 lg:grid-cols-12 lg:gap-5">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-warm lg:col-span-6 lg:col-start-2">
        <Image src={c.image.url} alt={c.image.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
        {spots.map((s, i) => (
          <button
            key={s.productId}
            type="button"
            onClick={() => setActive(i)}
            onMouseEnter={() => setActive(i)}
            aria-label={`Show ${s.product!.name}`}
            aria-pressed={active === i}
            className={clsx(
              "absolute grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill border border-on-dark/70 backdrop-blur-sm transition-all duration-300",
              active === i ? "scale-110 bg-on-dark text-ink" : "bg-ink/30 text-on-dark",
            )}
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
          >
            <Plus className={clsx("size-4 transition-transform", active === i && "rotate-45")} aria-hidden />
          </button>
        ))}
      </div>
      <div className="flex flex-col justify-center lg:col-span-4 lg:col-start-8">
        <p className="t-overline text-ink-soft">{c.overline}</p>
        <h2 className="t-display mt-3 text-balance">{c.title}</h2>
        <p className="mt-4 max-w-sm text-body text-ink-soft">{c.body}</p>
        <ol className="mt-8 divide-y divide-line border-y border-line">
          {spots.map(({ product: p }, i) => (
            <li key={p!.id} onMouseEnter={() => setActive(i)}>
              <Link href={`/products/${p!.slug}`} className={clsx("flex items-center gap-4 py-3 transition-opacity", active !== i && "opacity-55 hover:opacity-100")}>
                <span className="w-5 font-serif text-h3 text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
                <span className="relative h-16 w-13 shrink-0 overflow-hidden rounded-sm bg-surface-warm">
                  <Image src={p!.images[0].url} alt="" fill sizes="52px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium">{p!.name}</span>
                  <span className="block truncate text-meta text-ink-soft">{p!.descriptor}</span>
                </span>
                <PriceTag price={p!.priceFrom} compareAt={p!.compareAtFrom} />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
