"use client";

import { useId, useState } from "react";
import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { footerCopy } from "@/data/copy";

// ponytail: backend has no newsletter endpoint yet (no table); success is local only. Wire to a subscribe route when it lands.
export function NewsletterForm({ tone = "light", placeholder, buttonLabel, consentText }: {
  tone?: "light" | "dark"; placeholder?: string; buttonLabel?: string; consentText?: string;
}) {
  const [done, setDone] = useState(false);
  const id = useId();
  const dark = tone === "dark";
  if (done) return <p role="status" className={clsx("mt-6 text-body", dark ? "text-on-dark/85" : "text-accent-deep")}>✓ {footerCopy.newsletterThanks}</p>;
  return (
    <form className="mt-6 max-w-md" onSubmit={(e) => { e.preventDefault(); setDone(true); toast.success(footerCopy.newsletterThanks); }}>
      <div className={clsx("flex items-center border-b", dark ? "border-on-dark/40 focus-within:border-on-dark" : "border-ink/30 focus-within:border-ink")}>
        <label htmlFor={id} className="sr-only">{footerCopy.newsletterLabel}</label>
        <input id={id} type="email" required autoComplete="email" placeholder={placeholder ?? footerCopy.newsletterLabel}
          className={clsx("h-12 min-w-0 flex-1 bg-transparent text-body-lg focus:outline-none", dark ? "text-on-dark placeholder:text-on-dark/50" : "text-ink placeholder:text-ink-muted")} />
        <button type="submit" className="inline-flex h-12 items-center gap-2 pl-4 text-body font-medium">
          {buttonLabel ?? footerCopy.newsletterCta} <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
      {consentText && <p className={clsx("mt-3 text-micro", dark ? "text-on-dark/60" : "text-ink-soft")}>{consentText}</p>}
    </form>
  );
}
