import Link from "next/link";
import { Lock } from "lucide-react";
import { site } from "@/data/site";
import { checkoutCopy } from "@/data/checkout";

/** Minimal checkout chrome: logo + secure badge + support. No nav to leak attention. */
export function CheckoutHeader() {
  return (
    <header className="border-b border-line bg-canvas">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-serif text-h2 leading-none" aria-label={`${site.name} home`}>{site.name}</Link>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-warm px-3 py-1 t-overline text-ink-soft">
          <Lock className="size-3.5" aria-hidden /> {checkoutCopy.secureBadge}
        </span>
        <a href={`mailto:${site.supportEmail}`} className="hidden text-meta text-ink-soft hover:text-ink sm:block">
          {site.supportEmail}
        </a>
      </div>
    </header>
  );
}
