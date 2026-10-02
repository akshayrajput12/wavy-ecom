"use client";

import { ButtonLink } from "@/components/ui/Button";
import { Float, Parallax, Reveal } from "@/components/ui/Reveal";
import { ImageWell } from "@/components/commerce/ImageWell";
import { PriceTag } from "@/components/commerce/PriceTag";
import { openQuickView } from "@/components/commerce/QuickView";
import { homeCopy, quickViewCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { HeadingLines } from "./HeadingLines";

/** Resting spots on the stage (percent of stage), up to five products. */
const SPOTS = [
  { left: "8%", top: "12%" }, { left: "58%", top: "8%" }, { left: "34%", top: "40%" },
  { left: "6%", top: "62%" }, { left: "64%", top: "58%" },
];

/** Lifestyle image (or paper stage) with product cards drifting gently; a click opens Quick View. */
export function FloatingShowcase({ section }: { section: HomeSectionOf<"floating_showcase"> }) {
  const { image, imageAlt, cta } = section.config;
  const products = section.products.slice(0, SPOTS.length);
  return (
    <section className="container-x section-y">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-4">
          {section.title && <HeadingLines line={section.title} />}
          {section.subtitle && <p className="mt-4 max-w-sm text-body text-ink-soft">{section.subtitle}</p>}
          <p className="t-index mt-5 text-ink-soft">{homeCopy.showcaseHint}</p>
          {cta && <ButtonLink href={cta.href} size="lg" className="mt-8">{cta.label}</ButtonLink>}
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface-warm sm:aspect-[16/11] lg:col-span-8">
          {image && (
            <Parallax className="absolute! inset-0">
              <ImageWell media={{ url: image, alt: imageAlt ?? "" }} sizes="(min-width: 1024px) 66vw, 100vw" className="size-full bg-transparent" />
            </Parallax>
          )}
          <ul>
            {products.map((p, i) => (
              <li key={p.id} className="absolute w-[36%] sm:w-[26%]" style={SPOTS[i]}>
                <Reveal delay={0.1 + i * 0.08} y={24}>
                  <Float amplitude={8 + (i % 3) * 3} duration={6 + i} delay={i * 0.7}>
                    <button type="button" onClick={() => openQuickView(p)} aria-label={quickViewCopy.open(p.name)}
                      className="lift group block w-full rounded-lg bg-surface p-2 text-left shadow-sm">
                      <ImageWell media={p.images[0]} alt="" sizes="(min-width: 640px) 20vw, 36vw" className="aspect-square rounded-md"
                        imgClassName="transition-[scale] duration-(--dur-slow) ease-soft group-hover:scale-[1.04]" />
                      <span className="mt-2 block truncate px-1 text-meta font-medium">{p.name}</span>
                      <PriceTag price={p.priceFrom} compareAt={p.compareAtFrom} className="px-1 pb-1 text-meta [&_span:last-child]:hidden sm:[&_span:last-child]:inline" />
                    </button>
                  </Float>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
