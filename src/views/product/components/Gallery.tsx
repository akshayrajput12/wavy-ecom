import Image from "next/image";
import { clsx } from "clsx";
import type { Media } from "@/types/domain";

/** Mobile: swipeable scroll-snap strip. Desktop: editorial stacked grid (first image full width). */
export function Gallery({ images, name }: { images: Media[]; name: string }) {
  return (
    <div aria-label={`${name} images`} role="region">
      <ul className="-mx-[var(--gutter)] flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-3 lg:overflow-visible">
        {images.map((img, i) => (
          <li key={img.url + i} className={clsx("relative w-full shrink-0 snap-center lg:w-auto", i === 0 && "lg:col-span-2")}>
            <div className={clsx("relative overflow-hidden bg-surface-warm lg:rounded-md", i === 0 ? "aspect-[4/5] lg:aspect-[5/6]" : "aspect-[4/5]")}>
              <Image src={img.url} alt={img.alt} fill priority={i === 0} sizes={i === 0 ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 29vw, 100vw"} className="object-cover" />
            </div>
            <span className="absolute bottom-3 right-3 rounded-pill bg-surface/85 px-2.5 py-1 text-micro font-medium tabular-nums backdrop-blur-sm lg:hidden" aria-hidden>
              {i + 1} / {images.length}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
