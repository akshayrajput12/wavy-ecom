"use client";

import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { adminCopy, blogCopy } from "@/data/copy";
import { homeCopy, homeStageCopy } from "@/data/storefront";
import { Bars, Head, Img, Overline, Title, ctaLabel, labels, viewAll, type MockProps } from "./PreviewParts";
import { ids, str } from "./shared";

const t = adminCopy.homeSections;
const pad = (n: number) => String(n).padStart(2, "0");
type Source = keyof typeof homeCopy.overline.products;

/** Rail cropped at the right edge, like the storefront's edge-bleeding rails (the third card is cut off). */
function Rail({ items, render }: { items: string[]; render: (label: string, i: number) => ReactNode }) {
  return (
    <div className="flex gap-2 overflow-hidden">
      {items.slice(0, 3).map((l, i) => <div key={i} className="min-w-0 shrink-0 basis-[38%]">{render(l, i)}</div>)}
    </div>
  );
}

/** Mirrors CategoryGrid: tall photo tiles with an index, the name over a dark gradient and an arrow chip. */
export function CategoryMock({ cfg, title, subtitle, lookups }: MockProps) {
  const names = labels(lookups.categories, ids(cfg, "categoryIds"), cfg.limit);
  return (
    <div className="p-4">
      <Head overline={homeCopy.overline.categories} title={title} subtitle={subtitle} fallback={homeCopy.overline.categories} more={viewAll} />
      <Rail items={names.length ? names : [t.noPreview]} render={(name, i) => (
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-ink text-on-dark">
          <span className="t-index absolute left-2 top-2 text-micro">({pad(i + 1)})</span>
          <ArrowUpRight className="absolute right-2 top-2 size-3" aria-hidden />
          <span className="absolute inset-x-2 bottom-2 line-clamp-2 font-display text-meta font-heading-sm">{name}</span>
        </div>
      )} />
    </div>
  );
}

/** Mirrors SubcategoryGrid: hairline cards (image well, name, offer bar, "Shop now ›"), 3 per row at mock scale. */
export function SubcategoryMock({ cfg, title, subtitle, lookups }: MockProps) {
  const picked = ids(cfg, "categoryIds");
  const subs = lookups.categories.filter((o) => !lookups.parents.some((p) => p.id === o.id)); // "empty = all": non-departments
  const names = labels(picked.length ? lookups.categories : subs, picked, cfg.limit);
  return (
    <div className="p-4">
      <Head overline={homeCopy.subcategories.overline} title={title} subtitle={subtitle} fallback={homeCopy.subcategories.overline} more={viewAll} />
      <div className="grid grid-cols-3 gap-2">
        {(names.length ? names : [t.noPreview]).slice(0, 6).map((name, i) => (
          <div key={i} className="rounded-md border border-line-soft bg-surface p-1 text-center">
            <div className="grid aspect-[4/5] place-items-center rounded-sm bg-ink font-display text-h3 text-on-dark/40" aria-hidden>{name.charAt(0)}</div>
            <p className="mt-1 truncate font-display text-micro font-heading-sm">{name}</p>
            {cfg.showOffer !== false && <Bars n={1} className="mx-auto mt-1 w-2/3" />}
            <p className="mt-1 text-micro underline decoration-line underline-offset-2">{homeCopy.shopNow} ›</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mirrors ProductCarouselSection: source overline + heading, then product cards (image well, name, price). */
export function ProductMock({ cfg, title, subtitle, lookups }: MockProps) {
  const source = str(cfg, "source") as Source | "";
  const manual = source === "manual" ? labels(lookups.products, ids(cfg, "productIds"), cfg.limit) : [];
  const from = source === "collection" ? lookups.collections.find((o) => o.id === cfg.collectionId)?.label
    : source === "category" ? lookups.categories.find((o) => o.id === cfg.categoryId)?.label : undefined;
  const cards = manual.length ? manual : Array.from({ length: Math.min(typeof cfg.limit === "number" ? cfg.limit : 4, 4) }, () => "");
  return (
    <div className="p-4">
      <Head overline={source ? homeCopy.overline.products[source] : t.pickSource} title={title} subtitle={subtitle} fallback={homeCopy.slideshow} more={ctaLabel(cfg)} />
      {from && <p className="mb-2 text-micro text-ink-soft">{t.fromSource(from)}</p>}
      <Rail items={cards} render={(name) => (
        <div>
          <div className="aspect-[4/5] rounded-md bg-surface-2" />
          {name ? <p className="mt-1.5 truncate text-micro font-medium">{name}</p> : <Bars n={1} className="mt-2" />}
          <Bars n={1} className="mt-1.5 w-1/2" />
        </div>
      )} />
    </div>
  );
}

/** Mirrors CollectionRail ("in the wild"): dark stage, overline + display title + count, edge-to-edge muted panels. */
export function CollectionMock({ cfg, title, subtitle, lookups }: MockProps) {
  const names = labels(lookups.collections, ids(cfg, "collectionIds"), cfg.limit);
  return (
    <div className="on-dark py-4">
      <div className="flex items-end justify-between gap-3 px-4 pb-3">
        <div className="min-w-0">
          <Overline>{subtitle || homeStageCopy.lookbookOverline}</Overline>
          <Title text={title} fallback={homeCopy.slideshow} className="mt-1 text-body-lg" />
        </div>
        <Overline className="shrink-0">{homeStageCopy.lookbookCount(names.length)}</Overline>
      </div>
      <div className="flex gap-0.5 overflow-hidden">
        {(names.length ? names : [t.noPreview]).slice(0, 3).map((n, i) => (
          <div key={i} className="relative aspect-[3/4] shrink-0 basis-[44%] bg-surface-2">
            <span className="absolute inset-x-2 bottom-2 truncate text-micro">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mirrors Testimonials: centred chip + heading, then quote columns (author initials, stars, quote). */
export function TestimonialsMock({ cfg, title, subtitle }: MockProps) {
  const n = Math.min(typeof cfg.limit === "number" ? cfg.limit : 3, 3);
  return (
    <div className="p-4 text-center">
      <span className="inline-block rounded-pill border border-line px-2.5 py-0.5 text-micro text-ink-soft">{homeCopy.testimonialsChip}</span>
      {title && <Title text={title} soft={subtitle} fallback="" className="mt-2 text-body-lg" />}
      <div className="mt-3 grid grid-cols-3 gap-2 text-left">
        {Array.from({ length: n }, (_, i) => (
          <div key={i} className="border-t border-line pt-2">
            <span className="mb-1.5 block size-5 rounded-pill bg-ink" aria-hidden />
            <Bars n={3} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-micro text-ink-soft">{t.testimonialsNote}{typeof cfg.limit === "number" ? ` · ${t.upTo(cfg.limit)}` : ""}</p>
    </div>
  );
}

/** Mirrors BlogRail: Journal heading, three post cards (4:3 cover, meta, title). */
export function BlogMock({ cfg, title, subtitle }: MockProps) {
  const slug = str(cfg, "categorySlug");
  return (
    <div className="p-4">
      <Head overline={homeCopy.overline.blog} title={title || blogCopy.title} subtitle={subtitle} fallback={blogCopy.title} more={viewAll} />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <Img src="" alt="" compact className="relative aspect-[4/3] rounded-md" />
            <Bars n={2} className="mt-2" />
          </div>
        ))}
      </div>
      <p className="mt-3 text-micro text-ink-soft">{t.postsNote}{slug ? ` · ${slug}` : ""}</p>
    </div>
  );
}
