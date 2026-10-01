import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { layoutCopy } from "@/data/storefront";

/** Admin-uploaded brand image at a fixed height, natural width. alt = store name (the accessible name everywhere). */
export function BrandImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // ponytail: width/height 0 + h-*/w-auto lets any logo aspect ratio render; .svg is served unoptimized by next/image
  return <Image src={src} alt={alt} width={0} height={0} sizes="240px" className={clsx("w-auto max-w-60 object-contain", className ?? "h-8")} />;
}

export interface LogoProps {
  storeName: string; logoUrl?: string; logoDarkUrl?: string;
  /** Over a dark stage: prefer the light variant. */
  dark?: boolean; className?: string;
}

/** Store logo (from settings) linking home; falls back to a monogram circle + store name. */
export function Logo({ storeName, logoUrl, logoDarkUrl, dark, className }: LogoProps) {
  const src = (dark && logoDarkUrl) || logoUrl;
  return (
    <Link
      href="/"
      aria-label={layoutCopy.home(storeName)}
      className={clsx("inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-pill font-display text-body-lg font-semibold tracking-tight", className)}
    >
      {src ? <BrandImage src={src} alt={storeName} /> : (
        <>
          <span aria-hidden className="grid size-8 place-items-center rounded-pill bg-ink text-meta font-bold uppercase text-canvas">
            {storeName.charAt(0)}
          </span>
          <span>{storeName}</span>
        </>
      )}
    </Link>
  );
}
