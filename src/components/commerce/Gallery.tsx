"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { clsx } from "clsx";
import { useReducedMotion } from "@/components/ui/useMediaQuery";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { pdpCopy } from "@/data/storefront";
import type { Media } from "@/types/domain";
import { ImageWell } from "./ImageWell";

/** Hover zoom follows the pointer (fine pointers only). */
function zoomAt(e: MouseEvent<HTMLDivElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
  e.currentTarget.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
}
const pad = (n: number) => String(n).padStart(2, "0");
const arrow = "grid size-11 place-items-center rounded-pill transition-colors duration-(--dur-fast) disabled:pointer-events-none";

/**
 * Product gallery (PDP + Quick View): scroll-snap track (native swipe), ←/→ keys on the focused track,
 * circular prev/next, mono counter and thumbnails. `stack` turns it into a vertical image stack from lg
 * (PDP, beside the sticky info column). `focusUrl` brings a variant's image into view.
 */
export function Gallery({ images, name, focusUrl, sizes, aspect = "aspect-[4/5]", stack, zoom }: {
  images: Media[]; name: string; focusUrl?: string; sizes: string; aspect?: string; stack?: boolean; zoom?: boolean;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const last = images.length - 1;

  const goTo = useCallback((i: number) => {
    const el = track.current;
    el?.scrollTo({ left: Math.max(0, Math.min(i, last)) * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }, [last, reduce]);
  useEffect(() => {
    const i = images.findIndex((m) => m.url === focusUrl);
    if (i >= 0) goTo(i);
  }, [focusUrl, images, goTo]);

  const onKey = (e: KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    goTo(index + d);
  };

  if (!images.length) return <ImageWell sizes={sizes} className={clsx(aspect, "rounded-lg")} />;
  const lgHide = stack && "lg:hidden";

  return (
    <div role="region" aria-label={pdpCopy.images(name)}>
      <div className="relative">
        <ul ref={track} tabIndex={0} onKeyDown={onKey} onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className={clsx(
            "flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-lg [scrollbar-width:none] focus-visible:outline-offset-4 [&::-webkit-scrollbar]:hidden",
            stack && "lg:grid lg:snap-none lg:grid-cols-2 lg:gap-3 lg:overflow-visible lg:rounded-none",
          )}>
          {images.map((img, i) => (
            <li key={img.url + i} className={clsx("w-full shrink-0 snap-center", stack && (i === 0 || (i === last && images.length % 2 === 0)) && "lg:col-span-2")}>
              <div onMouseMove={zoom ? zoomAt : undefined} className={clsx("group relative overflow-hidden bg-surface-2", aspect, stack && "lg:rounded-lg", zoom && "pointer-fine:cursor-zoom-in")}>
                <Image src={img.url} alt={img.alt || name} fill preload={i === 0} sizes={sizes}
                  className={clsx("object-cover", zoom && "[transform-origin:var(--zx,50%)_var(--zy,50%)] transition-[scale] duration-(--dur-base) ease-soft pointer-fine:group-hover:scale-[1.8]")} />
              </div>
            </li>
          ))}
        </ul>
        {images.length > 1 && (
          <div className={clsx("pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between", lgHide)}>
            <span className="t-index rounded-pill bg-canvas/85 px-2.5 py-1 backdrop-blur-sm" aria-hidden>{pad(index + 1)} / {pad(images.length)}</span>
            <span className="pointer-events-auto flex gap-1.5">
              <button type="button" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label={pdpCopy.prevImage}
                className={clsx(arrow, "bg-canvas/85 backdrop-blur-sm hover:bg-ink hover:text-canvas disabled:opacity-40")}>
                <ChevronLeftIcon className="size-4" />
              </button>
              <button type="button" onClick={() => goTo(index + 1)} disabled={index === last} aria-label={pdpCopy.nextImage}
                className={clsx(arrow, "bg-ink text-canvas hover:bg-ink/85 disabled:opacity-40")}>
                <ChevronRightIcon className="size-4" />
              </button>
            </span>
          </div>
        )}
      </div>
      {images.length > 1 && (
        <ul className={clsx("mt-3 flex gap-2 overflow-x-auto p-0.5 [scrollbar-width:none]", lgHide)}>
          {images.map((img, i) => (
            <li key={img.url + i} className="shrink-0">
              <button type="button" onClick={() => goTo(i)} aria-label={pdpCopy.showImage(i + 1)} aria-current={i === index || undefined}
                className={clsx("block size-16 overflow-hidden rounded-md border transition-[border-color,opacity] duration-(--dur-fast)", i === index ? "border-ink" : "border-transparent opacity-70 hover:opacity-100")}>
                <ImageWell media={img} alt="" sizes="64px" className="size-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
