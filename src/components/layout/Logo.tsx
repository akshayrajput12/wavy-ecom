import Link from "next/link";
import { clsx } from "clsx";
import { layoutCopy } from "@/data/storefront";

/** Monogram circle + store name, linking home. Store name comes from settings; the mark is its initial. */
export function Logo({ storeName, className }: { storeName: string; className?: string }) {
  return (
    <Link
      href="/"
      aria-label={layoutCopy.home(storeName)}
      className={clsx("inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-pill font-display text-body-lg font-semibold tracking-tight", className)}
    >
      <span aria-hidden className="grid size-8 place-items-center rounded-pill bg-ink text-meta font-bold uppercase text-canvas">
        {storeName.charAt(0)}
      </span>
      <span>{storeName}</span>
    </Link>
  );
}
