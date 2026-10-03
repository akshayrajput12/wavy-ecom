import { Lock } from "lucide-react";
import Link from "next/link";
import { BrandImage, isCleanLogo } from "@/components/layout/Logo";
import { checkoutCopy } from "@/data/copy";

/** Minimal checkout chrome: a floating pill with store name, secure badge, support. No nav to pull attention away. */
export function CheckoutHeader({ storeName, logoUrl, supportEmail }: { storeName: string; logoUrl?: string; supportEmail?: string }) {
  return (
    <header className="container-x pt-3">
      <div className="flex h-14 items-center justify-between gap-4 rounded-pill border border-line bg-surface/80 pl-5 pr-2 shadow-sm backdrop-blur-md sm:pl-6">
        <Link href="/" className="inline-flex min-h-11 items-center font-display text-h2 font-heading-sm leading-none tracking-(--tracking-display)" aria-label={`${storeName} home`}>
          {isCleanLogo(logoUrl) ? <BrandImage src={logoUrl} alt={storeName} /> : storeName}
        </Link>
        <div className="flex items-center gap-4">
          {supportEmail && <a href={`mailto:${supportEmail}`} className="hidden text-meta text-ink-soft hover:text-ink sm:block">{supportEmail}</a>}
          <span className="t-overline inline-flex h-10 items-center gap-1.5 rounded-pill bg-ink px-4 text-canvas">
            <Lock className="size-3.5" aria-hidden /> {checkoutCopy.secureBadge}
          </span>
        </div>
      </div>
    </header>
  );
}
