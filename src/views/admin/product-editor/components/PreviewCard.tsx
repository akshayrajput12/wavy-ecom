import { Star } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import type { PreviewModel } from "./previewData";

export function Stars({ avg, count }: { avg: number; count: number }) {
  if (!count && !avg) return <p className="t-meta">No reviews yet</p>;
  return (
    <p className="flex items-center gap-1 text-meta text-ink-soft">
      <Star className="size-3.5 fill-ink text-ink" aria-hidden />
      <span>{avg.toFixed(1)} out of 5</span><span>({count} reviews)</span>
    </p>
  );
}

export function PreviewImage({ url, alt, sizes }: { url?: string; alt: string; sizes: string }) {
  return url
    ? <Image src={url} alt={alt} fill unoptimized sizes={sizes} className="object-cover" />
    : <span className="absolute inset-0 grid place-items-center text-meta text-ink-muted">No image</span>;
}

/** Storefront-like listing card, driven by the form. */
export function PreviewCard({ m, brand }: { m: PreviewModel; brand: string }) {
  return (
    <article className="w-56 max-w-full">
      <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-warm">
        <PreviewImage url={m.images[0]?.url} alt={m.images[0]?.alt ?? ""} sizes="224px" />
        {m.badges[0] && <span className="absolute left-2 top-2"><Badge tone="dark">{m.badges[0]}</Badge></span>}
      </div>
      <div className="mt-2 grid gap-0.5">
        {brand && <p className="t-overline text-ink-soft">{brand}</p>}
        <h3 className="text-body font-medium">{m.title}</h3>
        <p className="flex items-baseline gap-2 text-body">
          <span className="font-medium">{m.priceText}</span>
          {m.compareText && <><s className="text-meta text-ink-soft">{m.compareText}</s><span className="text-meta text-success">{m.off}% off</span></>}
        </p>
      </div>
    </article>
  );
}
