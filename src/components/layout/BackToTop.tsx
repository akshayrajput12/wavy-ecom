"use client";

import { ArrowUpIcon } from "@/components/ui/icons";
import { scrollToTop } from "@/components/providers/SmoothScroll";
import { footerCopy } from "@/data/copy";

/** Footer "Back to top": Lenis glide (native smooth scroll without it), arrow nudges up on hover. */
export function BackToTop() {
  return (
    <button type="button" onClick={scrollToTop}
      className="group inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-4 text-micro font-medium text-ink transition-colors hover:border-ink">
      {footerCopy.backToTop}
      <ArrowUpIcon className="size-3.5" />
    </button>
  );
}
