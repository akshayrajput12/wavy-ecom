"use client";

import { useId, useState } from "react";
import { ArrowRightIcon } from "@/components/ui/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { footerCopy } from "@/data/copy";

// ponytail: same local-only success as layout/NewsletterForm (no subscribe endpoint yet); wire both when the route lands.
export function NewsletterPill({ placeholder, buttonLabel, consentText }: { placeholder?: string; buttonLabel?: string; consentText?: string }) {
  const [done, setDone] = useState(false);
  const id = useId();
  if (done) return <p role="status" className="text-body-lg font-medium">✓ {footerCopy.newsletterThanks}</p>;
  return (
    <form className="w-full max-w-lg lg:justify-self-end" onSubmit={(e) => { e.preventDefault(); setDone(true); toast.success(footerCopy.newsletterThanks); }}>
      <label htmlFor={id} className="sr-only">{footerCopy.newsletterLabel}</label>
      <div className="flex items-center gap-2 rounded-pill border border-line bg-surface p-1.5 pl-5 transition-colors focus-within:border-ink focus-within:ring-1 focus-within:ring-ink">
        <input id={id} type="email" required autoComplete="email" placeholder={placeholder ?? footerCopy.newsletterLabel}
          className="h-11 min-w-0 flex-1 bg-transparent text-body-lg text-ink placeholder:text-ink-muted focus:outline-none" />
        <Button type="submit" className="shrink-0">
          {buttonLabel ?? footerCopy.newsletterCta} <ArrowRightIcon className="size-4" />
        </Button>
      </div>
      {consentText && <p className="mt-3 px-5 text-micro text-ink-soft">{consentText}</p>}
    </form>
  );
}
