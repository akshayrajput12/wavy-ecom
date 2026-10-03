import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { layoutCopy } from "@/data/storefront";

/** Admin-uploaded brand image at a fixed height, natural width. alt = store name (the accessible name everywhere). */
export function BrandImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  // ponytail: width/height 0 + h-*/w-auto lets any logo aspect ratio render; .svg is served unoptimized by next/image
  return <Image src={src} alt={alt} width={0} height={0} sizes="240px" className={clsx("w-auto max-w-60 object-contain", className ?? "h-8")} />;
}

/**
 * JPEG has no alpha channel, so it always carries a solid background box: on the glass header and the paper footer
 * it reads as a pasted sticker. Such logos give way to the wordmark.
 * ponytail: extension check only; an opaque PNG/WebP still slips through (the admin hint asks for transparent).
 * Upgrade path: probe the alpha channel at upload and store a flag.
 */
export const isCleanLogo = (url?: string): url is string => !!url && !/\.jpe?g(\?|#|$)/i.test(url);

// Header: 28px tall on mobile, 32px from sm, wide marks capped at 160/176px. Footer: one step bigger.
const SIZES = {
  header: { img: "h-7 max-w-40 sm:h-8 sm:max-w-44", name: "text-h3 sm:text-h2" },
  footer: { img: "h-10 max-w-48 sm:h-12 sm:max-w-56", name: "text-h2 sm:text-h1" },
} as const;

export interface LogoProps {
  storeName: string; logoUrl?: string; logoDarkUrl?: string;
  /** Over a dark stage: only the dark-stage variant is used (the normal logo is dark ink or sits on a light box). */
  dark?: boolean; size?: keyof typeof SIZES; className?: string;
}

/** Store logo (from settings) linking home; without a usable image for the current stage, the store name as a wordmark. */
export function Logo({ storeName, logoUrl, logoDarkUrl, dark, size = "header", className }: LogoProps) {
  const src = dark ? logoDarkUrl : logoUrl;
  const s = SIZES[size];
  return (
    <Link href="/" aria-label={layoutCopy.home(storeName)} className={clsx("inline-flex min-h-11 min-w-0 items-center rounded-pill", className)}>
      {isCleanLogo(src) ? <BrandImage src={src} alt={storeName} className={s.img} /> : (
        <span className={clsx("truncate font-display font-heading-sm leading-none tracking-(--tracking-display)", s.name)}>{storeName}</span>
      )}
    </Link>
  );
}
