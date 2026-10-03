"use client";

import { clsx } from "clsx";
import { useState } from "react";
import { adminCopy } from "@/data/copy";
import { Img, Overline, Pill, Title, ctaLabel, type MockProps } from "./PreviewParts";
import { obj, str, type Cfg } from "./shared";

const t = adminCopy.homeSections;
const pad = (n: number) => String(n).padStart(2, "0");

/** Mirrors HeroCarousel: dark stage, copy + CTAs left, framed image right captioned by the control bar (counter, timer, buttons); plus a slide switcher. */
export function HeroMock({ cfg }: MockProps) {
  const slides = (Array.isArray(cfg.slides) ? cfg.slides : []) as Cfg[];
  const [picked, setPicked] = useState(0);
  const i = Math.min(picked, Math.max(0, slides.length - 1)); // a removed slide falls back to the last one
  const s = slides[i] ?? {};
  const n = slides.length;
  const secondary = str(obj(s, "secondaryCta"), "label");
  return (
    <div>
      <div className="on-dark relative isolate grid aspect-[4/3] grid-cols-2 items-start gap-4 overflow-hidden p-4 pt-8">
        <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_72%_50%,var(--black-2)_0%,var(--black)_70%)]" />
        <div className="flex flex-col gap-2">
          {str(s, "eyebrow") && <Overline>{str(s, "eyebrow")}</Overline>}
          <Title text={str(s, "heading")} fallback={t.heading} className="text-body-lg" />
          {str(s, "body") && <p className="line-clamp-3 text-micro text-ink-soft">{str(s, "body")}</p>}
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Pill label={ctaLabel(s)} />
            <Pill label={secondary} outline />
          </div>
        </div>
        <div className="mx-auto flex w-[78%] flex-col gap-2">
          <Img src={str(s, "image")} alt={str(s, "imageAlt")} className="aspect-[4/5] w-full rounded-lg shadow-lg" />
          {n > 1 && (
            <div className="flex items-center justify-between border-t border-line pt-1.5" aria-hidden>
              <p className="t-index flex items-center gap-1.5 text-ink-soft"><span className="text-ink">{pad(i + 1)}</span><span className="relative h-px w-6 bg-line"><span className="absolute inset-y-0 left-0 w-1/2 bg-ink" /></span>{pad(n)}</p>
              <span className="flex gap-1">{[0, 1, 2].map((k) => <span key={k} className="size-3 rounded-pill border border-line" />)}</span>
            </div>
          )}
        </div>
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
