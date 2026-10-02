"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { adminCopy } from "@/data/copy";
import { Img, Overline, Pill, Title, ctaLabel, type MockProps } from "./PreviewParts";
import { obj, str, type Cfg } from "./shared";

const t = adminCopy.homeSections;
const pad = (n: number) => String(n).padStart(2, "0");

/** Mirrors HeroCarousel: dark stage, counter, copy left, floating product right, next-up thumb; plus a slide switcher. */
export function HeroMock({ cfg }: MockProps) {
  const slides = (Array.isArray(cfg.slides) ? cfg.slides : []) as Cfg[];
  const [picked, setPicked] = useState(0);
  const i = Math.min(picked, Math.max(0, slides.length - 1)); // a removed slide falls back to the last one
  const s = slides[i] ?? {};
  const n = slides.length;
  const next = slides[(i + 1) % Math.max(1, n)] ?? {};
  const secondary = str(obj(s, "secondaryCta"), "label");
  return (
    <div>
      <div className="on-dark relative isolate aspect-[4/3] overflow-hidden p-4">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_60%_45%,var(--black-2)_0%,var(--black)_70%)]" />
        {n > 1 && <p className="t-index flex items-center gap-2 text-ink-soft"><span className="text-ink">{pad(i + 1)}</span><span className="h-px w-6 bg-line" />{pad(n)}</p>}
        <div className="mt-3 flex w-[48%] flex-col gap-2">
          {str(s, "eyebrow") && <Overline>{str(s, "eyebrow")}</Overline>}
          <Title text={str(s, "heading")} fallback={t.heading} className="text-body-lg" />
          {str(s, "body") && <p className="line-clamp-3 text-micro text-ink-soft">{str(s, "body")}</p>}
          <div className="flex flex-wrap gap-1.5">
            <Pill label={ctaLabel(s)} />
            <Pill label={secondary} outline />
          </div>
        </div>
        <Img src={str(s, "image")} alt={str(s, "imageAlt")} className="absolute right-[8%] top-1/2 aspect-[4/5] w-[36%] -translate-y-1/2 rounded-lg shadow-lg" />
        {n > 1 && <Img src={str(next, "image")} alt="" compact className="absolute bottom-3 right-3 size-10 rounded-sm border border-line" />}
      </div>
      {n > 1 && (
        <div className="flex flex-wrap items-center gap-1 border-t border-line bg-surface p-2" role="group" aria-label={t.slides}>
          {slides.map((_, j) => (
            <button key={j} type="button" onClick={() => setPicked(j)} aria-pressed={j === i} aria-label={t.slide(j + 1)}
              className={clsx("t-index grid size-11 place-items-center rounded-pill transition-colors", j === i ? "bg-ink text-canvas" : "text-ink-soft hover:bg-surface-warm")}>
              {pad(j + 1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
