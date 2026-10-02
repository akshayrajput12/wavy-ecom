"use client";

import { clsx } from "clsx";
import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { adminCopy } from "@/data/copy";

/**
 * Admin-side image that never shows the browser's broken-image glyph: a missing or failing `src` renders a stone
 * placeholder (icon + label) instead. Fills its positioned parent. `unoptimized` so blob: previews and paths that
 * aren't in the optimizer's allow-list render as-is. next/image re-fires errors that happened before hydration.
 */
export function SafeImage({ src, alt, sizes, className, label = adminCopy.dropzone.noImage, compact }: {
  src?: string | null; alt: string; sizes: string; className?: string; label?: string; compact?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) {
    return (
      <span role="img" aria-label={label} className={clsx("absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-accent text-accent-deep", className)}>
        <ImageOff className={compact ? "size-4" : "size-5"} aria-hidden />
        {!compact && <span className="text-micro font-medium">{label}</span>}
      </span>
    );
  }
  return <Image src={src} alt={alt} fill unoptimized sizes={sizes} className={clsx("object-cover text-transparent", className)} onError={() => setFailed(src)} />;
}
