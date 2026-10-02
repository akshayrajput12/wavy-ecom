import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { layoutCopy } from "@/data/storefront";

/** Admin-uploaded brand image at a fixed height, natural width. alt = store name (the accessible name everywhere). */
export function BrandImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // ponytail: width/height 0 + h-*/w-auto lets any logo aspect ratio render; .svg is served unoptimized by next/image
  return <Image src={src} alt={alt} width={0} height={0} sizes="240px" className={clsx("w-auto max-w-60 object-contain", className ?? "h-8")} />;
}

// Header: 28px tall on mobile, 36px from sm, wide marks capped at 160/176px. Footer: one step bigger.
const SIZES = {
  header: { img: "h-7 max-w-40 sm:h-9 sm:max-w-44", mark: "size-7 text-meta sm:size-9 sm:text-body", name: "text-body-lg sm:text-h3" },
  footer: { img: "h-10 max-w-48 sm:h-12 sm:max-w-56", mark: "size-10 text-body sm:size-12 sm:text-body-lg", name: "text-h3 sm:text-h2" },
} as const;

export interface LogoProps {
  storeName: string; logoUrl?: string; logoDarkUrl?: string;
  /** Over a dark stage: prefer the light variant. */
  dark?: boolean; size?: keyof typeof SIZES; className?: string;
}

/** Store logo (from settings) linking home; falls back to a monogram circle + store name. */
export function Logo({ storeName, logoUrl, logoDarkUrl, dark, size = "header", className }: LogoProps) {
  const src = (dark && logoDarkUrl) || logoUrl;
  const s = SIZES[size];
  return (
    <Link
      href="/"
      aria-label={layoutCopy.home(storeName)}
      className={clsx("inline-flex min-h-11 min-w-0 items-center gap-2.5 rounded-pill font-display font-semibold leading-none tracking-tight", className)}
    >
      {src ? <BrandImage src={src} alt={storeName} className={s.img} /> : (
        <>
          <span aria-hidden className={clsx("grid shrink-0 place-items-center rounded-pill bg-ink font-bold uppercase text-canvas", s.mark)}>
            {storeName.charAt(0)}
          </span>
          <span className={clsx("truncate", s.name)}>{storeName}</span>
        </>
      )}
    </Link>
  );
}
