import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { Reveal } from "@/components/ui/Reveal";
import { formatPrice } from "@/lib/format";
import type { Lookbook } from "@/backend/content/repo";
import type { Product } from "@/types/domain";

const SPAN = {
  tall: { col: "md:col-span-5", ratio: "aspect-[3/4]" },
  wide: { col: "md:col-span-7", ratio: "aspect-[4/3]" },
  square: { col: "md:col-span-6", ratio: "aspect-square" },
} as const;

/** Screen 40 — editorial grid, every look links to its products. */
export function LookbookView({ lookbook: l, products }: { lookbook: Lookbook; products: Product[] }) {
  const byId = new Map(products.map((p) => [p.id, p]));
  return (
    <div className="container-x pb-24">
      <header className="grid gap-6 py-10 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-7">
          <p className="t-overline text-ink-soft">{l.overline}</p>
          <h1 className="font-serif text-[clamp(3.5rem,11vw,10rem)] leading-[0.9] tracking-tight">{l.title}</h1>
        </div>
        <p className="self-end text-body-lg text-ink-soft lg:col-span-4 lg:col-start-9">{l.intro}</p>
      </header>

      <div className="grid gap-x-5 gap-y-16 md:grid-cols-12">
        {l.looks.map((look, i) => (
          <Reveal key={look.id} className={clsx("flex flex-col", SPAN[look.span].col, i % 2 === 1 && "md:mt-24")}>
            <figure>
              <div className={clsx("relative overflow-hidden rounded-sm bg-surface-warm", SPAN[look.span].ratio)}>
                <Image src={look.image.url} alt={look.image.alt} fill sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="mt-4 flex items-baseline justify-between gap-4">
                <span className="font-serif text-h2">{look.title}</span>
                <span className="t-overline text-ink-soft">{String(i + 1).padStart(2, "0")} / {String(l.looks.length).padStart(2, "0")}</span>
              </figcaption>
            </figure>
            <p className="t-overline mt-4 text-ink-soft">{l.shopLabel}</p>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {look.productIds.map((id) => byId.get(id)).filter((p): p is Product => !!p).map((p) => (
                <li key={p.id}>
                  <Link href={`/products/${p.slug}`} className="flex min-h-12 items-center justify-between gap-4 py-2 text-body hover:text-accent-deep">
                    <span>{p.name} <span className="text-ink-soft">— {p.descriptor}</span></span>
                    <span className="tabular-nums">{formatPrice(p.priceFrom)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
