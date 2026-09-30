import Image from "next/image";
import { clsx } from "clsx";
import { ImageOff } from "lucide-react";
import { pdpCopy } from "@/data/storefront";
import type { Media } from "@/types/domain";

/** Image on the neutral `surface-2` well (mixed packshots look consistent), with a calm placeholder when missing. */
export function ImageWell({ media, sizes, preload, className, imgClassName, alt }: {
  media?: Media; sizes: string; preload?: boolean; className?: string; imgClassName?: string; alt?: string;
}) {
  return (
    <div className={clsx("relative overflow-hidden bg-surface-2", className)}>
      {media?.url ? (
        <Image src={media.url} alt={alt ?? media.alt} fill sizes={sizes} preload={preload} className={clsx("object-cover", imgClassName)} />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-ink-muted">
          <ImageOff className="size-6" aria-hidden />
          <span className="sr-only">{pdpCopy.noImage}</span>
        </div>
      )}
    </div>
  );
}
