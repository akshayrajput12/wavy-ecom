"use client";

import { clsx } from "clsx";
import { adminCopy } from "@/data/copy";
import { TearCopy } from "@/components/ui/TearCopy";
import { viewBox } from "@/components/ui/tearGeometry";
import { homeCopy } from "@/data/storefront";
import { Img, Overline, Pill, Title, ctaLabel, labels, type MockProps } from "./PreviewParts";
import { ids, str } from "./shared";

const t = adminCopy.homeSections;
const Coupon = ({ code }: { code: string }) =>
  code ? <span className="t-index inline-flex h-7 items-center rounded-pill border border-dashed border-ink px-3 text-micro">{homeCopy.useCode} {code}</span> : null;

/** Mirrors PromoBanner: dark = inset band, centred copy, image rising from the bottom; light = image left, copy right. */
export function PromoMock({ cfg, title }: MockProps) {
  const dark = cfg.theme === "dark";
  const label = ctaLabel(cfg);
  const image = <Img src={str(cfg, "image")} alt={str(cfg, "imageAlt")} className={clsx("relative", dark ? "mx-auto mt-4 aspect-[16/7] w-[92%] rounded-t-md" : "aspect-[4/5] rounded-lg")} />;
  const copy = (
    <>
      {title && <Overline>{title}</Overline>}
      <Title text={str(cfg, "heading")} fallback={t.heading} className="mt-1 text-body-lg" />
      {str(cfg, "body") && <p className="mt-1 line-clamp-3 text-micro text-ink-soft">{str(cfg, "body")}</p>}
      <div className={clsx("mt-2 flex flex-wrap items-center gap-1.5", dark && "justify-center")}>
        {dark ? <Pill label={label} /> : label && <span className="text-micro font-medium underline underline-offset-2">{label} ›</span>}
        <Coupon code={str(cfg, "couponCode")} />
      </div>
    </>
  );
  if (dark) return <div className="p-2"><div className="on-dark overflow-hidden rounded-lg px-4 pt-5 text-center">{copy}{image}</div></div>;
  return <div className="grid grid-cols-2 items-center gap-3 p-4">{image}<div>{copy}</div></div>;
}

// Jagged tear through the word, as on the live poster: the frame (928 x 468 units) is fitted to this 4:3 box's width,
// so the pivot (y 318) lands at ~56% of its height and the word (820 units wide, y 229..404) spans ~43%..68%.
const TEAR = [54, 60, 52, 63, 55, 59, 51, 61, 56, 58, 53];
const edge = TEAR.map((y, i) => `${(i * 100) / (TEAR.length - 1)}% ${y}%`);
const TOP = `polygon(0 0, 100% 0, ${[...edge].reverse().join(", ")})`;
const BOTTOM = `polygon(${edge.join(", ")}, 100% 100%, 0 100%)`;

/** Mirrors TearReveal once torn: the paper poster (same copy and proportions) split along the tear, parted over the tiger (or the photo). */
export function TearMock({ cfg }: MockProps) {
  const photo = cfg.variant === "image";
  const sheet = (clip: string, shift: string) => (
    <div className="absolute inset-0 bg-canvas" style={{ clipPath: clip, translate: `0 ${shift}` }}>
      <svg aria-hidden viewBox={viewBox()} className="absolute inset-0 size-full">
        <TearCopy word={str(cfg, "word") || t.word} tagline={str(cfg, "tagline") || undefined} />
      </svg>
    </div>
  );
  return (
    <div className="relative aspect-[4/3] overflow-hidden">
      {photo ? <Img src={str(cfg, "image")} alt={str(cfg, "imageAlt")} className="absolute inset-0" />
        : <div role="img" aria-label={t.tigerAlt} className="absolute inset-0 bg-[repeating-linear-gradient(115deg,var(--art-fur)_0_14px,var(--art-stripe)_14px_20px)]" />}
      {sheet(TOP, "-9%")}
      {sheet(BOTTOM, "9%")}
      <div className="absolute inset-x-0 bottom-3 flex justify-center"><Pill label={ctaLabel(cfg)} className="shadow-md" /></div>
    </div>
  );
}

/** Mirrors NewsletterSection: warm band, overline + heading + body, pill email field, consent line. */
export function NewsletterMock({ cfg, title }: MockProps) {
  return (
    <div className="p-2">
      <div className="rounded-lg bg-surface-warm p-4">
        {title && <Overline className="mb-1">{title}</Overline>}
        <Title text={str(cfg, "heading")} fallback={t.heading} className="text-body-lg" />
        {str(cfg, "body") && <p className="mt-1 text-micro text-ink-soft">{str(cfg, "body")}</p>}
        <div className="mt-3 flex items-center gap-2 rounded-pill border border-line bg-surface p-1 pl-3">
          <span className="min-w-0 flex-1 truncate text-micro text-ink-muted">{str(cfg, "placeholder") || t.emailPlaceholder}</span>
          <Pill label={str(cfg, "buttonLabel") || t.subscribe} />
        </div>
        {str(cfg, "consentText") && <p className="mt-2 text-micro text-ink-soft">{str(cfg, "consentText")}</p>}
      </div>
    </div>
  );
}

const SPOTS = [["8%", "12%"], ["58%", "8%"], ["34%", "40%"], ["6%", "62%"], ["64%", "58%"]] as const; // FloatingShowcase

/** Mirrors FloatingShowcase: title, subtitle, hint and button, then a photo (or paper) stage with floating product cards. */
export function FloatingMock({ cfg, title, subtitle, lookups }: MockProps) {
  const names = labels(lookups.products, ids(cfg, "productIds")).slice(0, SPOTS.length);
  const shown = ids(cfg, "productIds").length ? names : [];
  return (
    <div className="grid gap-3 p-4">
      <div>
        <Title text={title} fallback={t.heading} className="text-body-lg" />
        {subtitle && <p className="mt-1 text-micro text-ink-soft">{subtitle}</p>}
        <p className="t-index mt-1 text-ink-soft">{homeCopy.showcaseHint}</p>
        <Pill label={ctaLabel(cfg)} className="mt-2" />
      </div>
      <div className="relative aspect-[16/11] overflow-hidden rounded-lg bg-surface-warm">
        {str(cfg, "image") && <Img src={str(cfg, "image")} alt={str(cfg, "imageAlt")} className="absolute inset-0" />}
        {shown.map((n, i) => (
          <div key={i} className="absolute w-[26%] rounded-md bg-surface p-1 shadow-sm" style={{ left: SPOTS[i][0], top: SPOTS[i][1] }}>
            <div className="aspect-square rounded-sm bg-surface-2" />
            <p className="mt-1 truncate text-micro font-medium">{n}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
