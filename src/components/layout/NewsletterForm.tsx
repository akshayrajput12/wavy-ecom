"use client";

import { useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { footerCopy } from "@/data/copy";

// ponytail: backend has no newsletter endpoint yet (no table); success is local only. Wire to a subscribe route when it lands.
/**
 * Pill email field + ink submit. Token-driven, so it reads correctly on paper and inside `.on-dark`.
 * `tone` is kept for callers; dark simply means "sits on a dark stage" and needs no extra classes.
 */
export function NewsletterForm({ placeholder, buttonLabel, consentText }: {
  tone?: "light" | "dark"; placeholder?: string; buttonLabel?: string; consentText?: string;
}) {
  const [done, setDone] = useState(false);
  const id = useId();
  if (done) return <p role="status" className="mt-6 text-body text-ink">✓ {footerCopy.newsletterThanks}</p>;
  return (
    <form className="mt-6 max-w-md" onSubmit={(e) => { e.preventDefault(); setDone(true); toast.success(footerCopy.newsletterThanks); }}>
      <div className="flex h-13 items-center rounded-pill border border-line bg-surface pl-5 pr-1.5 transition-colors focus-within:border-ink">
        <label htmlFor={id} className="sr-only">{footerCopy.newsletterLabel}</label>
        <input id={id} type="email" required autoComplete="email" placeholder={placeholder ?? footerCopy.newsletterLabel}
          className="h-full min-w-0 flex-1 bg-transparent text-body text-ink placeholder:text-ink-muted focus:outline-none" />
        <button type="submit" className="inline-flex h-10 min-w-11 shrink-0 items-center gap-2 rounded-pill bg-ink px-4 text-meta font-medium text-canvas transition-colors hover:bg-ink/85">
          {buttonLabel ?? footerCopy.newsletterCta} <ArrowRight className="size-3.5" aria-hidden />
        </button>
      </div>
      {consentText && <p className="mt-3 text-micro text-ink-soft">{consentText}</p>}
    </form>
  );
}
