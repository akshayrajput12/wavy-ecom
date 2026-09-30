"use client";

import { clsx } from "clsx";
import { ButtonLink } from "@/components/ui/Button";
import { Float } from "@/components/ui/Reveal";
import { ImageWell } from "@/components/commerce/ImageWell";
import { PriceTag } from "@/components/commerce/PriceTag";
import { openQuickView } from "@/components/commerce/QuickView";
import { homeCopy, quickViewCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";

/** Resting spots on the stage (percent of stage), up to five products. */
const SPOTS = [
  { left: "8%", top: "12%" }, { left: "58%", top: "8%" }, { left: "34%", top: "40%" },
  { left: "6%", top: "62%" }, { left: "64%", top: "58%" },
];

/** Lifestyle image or soft gradient stage with products drifting gently; a click opens Quick View. */
export function FloatingShowcase({ section }: { section: HomeSectionOf<"floating_showcase"> }) {
  const { image, imageAlt, cta } = section.config;
  const products = section.products.slice(0, SPOTS.length);
  return (
    <section className="container-x section-y">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4">
          {section.title && <h2 className="t-display text-balance">{section.title}</h2>}
          {section.subtitle && <p className="mt-3 max-w-sm text-body-lg text-ink-soft">{section.subtitle}</p>}
          <p className="mt-4 text-meta text-ink-soft">{homeCopy.showcaseHint}</p>
          {cta && <ButtonLink href={cta.href} variant="secondary" className="mt-6">{cta.label}</ButtonLink>}
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-linear-to-br from-accent-soft via-surface-warm to-surface-2 sm:aspect-[16/11] lg:col-span-8">
          {image && <ImageWell media={{ url: image, alt: imageAlt ?? "" }} sizes="(min-width: 1024px) 66vw, 100vw" className="absolute! inset-0 bg-transparent" />}
          <ul>
            {products.map((p, i) => (
              <li key={p.id} className="absolute w-[36%] sm:w-[28%]" style={SPOTS[i]}>
                <Float amplitude={8 + (i % 3) * 3} duration={6 + i} delay={i * 0.7}>
                  <button type="button" onClick={() => openQuickView(p)} aria-label={quickViewCopy.open(p.name)}
                    className={clsx("group block w-full rounded-lg bg-surface/90 p-2 text-left shadow-md backdrop-blur-sm transition-[translate,box-shadow] duration-(--dur-base) ease-soft hover:-translate-y-1 hover:shadow-lg")}>
                    <ImageWell media={p.images[0]} alt="" sizes="(min-width: 640px) 20vw, 36vw" className="aspect-square rounded-md" />
                    <span className="mt-2 block truncate px-1 text-meta font-medium">{p.name}</span>
                    <PriceTag price={p.priceFrom} compareAt={p.compareAtFrom} className="px-1 text-meta [&_span:last-child]:hidden sm:[&_span:last-child]:inline" />
                  </button>
                </Float>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
