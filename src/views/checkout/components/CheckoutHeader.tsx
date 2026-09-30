import { Lock } from "lucide-react";
import Link from "next/link";
import { checkoutCopy } from "@/data/copy";

/** Minimal checkout chrome: store name, secure badge, support. No nav to pull attention away. */
export function CheckoutHeader({ storeName, supportEmail }: { storeName: string; supportEmail?: string }) {
  return (
    <header className="border-b border-line bg-canvas">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-serif text-h2 leading-none" aria-label={`${storeName} home`}>{storeName}</Link>
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent-soft px-3 py-1 t-overline text-accent-deep">
          <Lock className="size-3.5" aria-hidden /> {checkoutCopy.secureBadge}
        </span>
        {supportEmail ? (
          <a href={`mailto:${supportEmail}`} className="hidden text-meta text-ink-soft hover:text-ink sm:block">{supportEmail}</a>
        ) : <span className="hidden sm:block" />}
      </div>
    </header>
  );
}
