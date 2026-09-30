"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { clsx } from "clsx";
import { useReducedMotion } from "framer-motion";
import { ImageWell } from "@/components/commerce/ImageWell";
import { pdpCopy } from "@/data/storefront";
import type { Media } from "@/types/domain";

/** Hover zoom follows the pointer (desktop, fine pointers only). */
function zoomAt(e: MouseEvent<HTMLDivElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--zx", `${((e.clientX - r.left) / r.width) * 100}%`);
  e.currentTarget.style.setProperty("--zy", `${((e.clientY - r.top) / r.height) * 100}%`);
}

/** Swipeable scroll-snap gallery with thumbnails and zoom-on-hover. `focusUrl` jumps to a variant's image. */
export function Gallery({ images, name, focusUrl }: { images: Media[]; name: string; focusUrl?: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  const goTo = (i: number) => {
    const el = track.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  };
  useEffect(() => {
    const i = images.findIndex((m) => m.url === focusUrl);
    const el = track.current;
    if (i >= 0 && el) el.scrollTo({ left: i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }, [focusUrl, images, reduce]);

  if (!images.length) return <ImageWell sizes="(min-width: 1024px) 55vw, 100vw" className="aspect-square rounded-lg" />;

  return (
    <div role="region" aria-label={pdpCopy.images(name)} className="lg:flex lg:flex-row-reverse lg:gap-4">
      <div className="relative min-w-0 flex-1">
        <ul ref={track} tabIndex={0} onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="-mx-(--gutter) flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:mx-0 sm:rounded-lg [&::-webkit-scrollbar]:hidden">
          {images.map((img, i) => (
            <li key={img.url + i} className="w-full shrink-0 snap-center">
              <div onMouseMove={zoomAt} className="group relative aspect-square overflow-hidden bg-surface-2 lg:cursor-zoom-in">
                <Image src={img.url} alt={img.alt || name} fill preload={i === 0} sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover [transform-origin:var(--zx,50%)_var(--zy,50%)] transition-[scale] duration-(--dur-base) ease-soft pointer-fine:group-hover:scale-[1.8]" />
              </div>
            </li>
          ))}
        </ul>
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-pill bg-surface/85 px-2.5 py-1 text-micro font-medium tabular-nums backdrop-blur-sm lg:hidden" aria-hidden>
            {index + 1} / {images.length}
          </span>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] lg:mt-0 lg:w-20 lg:flex-col lg:overflow-visible">
          {images.map((img, i) => (
            <li key={img.url + i} className="shrink-0">
              <button type="button" onClick={() => goTo(i)} aria-label={pdpCopy.showImage(i + 1)} aria-current={i === index || undefined}
                className={clsx("block size-16 overflow-hidden rounded-sm border-2 transition-colors duration-(--dur-fast) lg:size-20", i === index ? "border-ink" : "border-transparent hover:border-line")}>
                <ImageWell media={img} alt="" sizes="80px" className="size-full" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
