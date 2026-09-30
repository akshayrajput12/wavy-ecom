"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { footerCopy } from "@/data/navigation";

// ponytail: no subscribe API yet; wire to POST /api/marketing/subscribe when the marketing service lands
export function NewsletterForm() {
  const [done, setDone] = useState(false);
  if (done) return <p role="status" className="mt-8 text-body text-on-dark/85">{footerCopy.newsletterThanks}</p>;
  return (
    <form
      className="mt-8 flex max-w-md items-center border-b border-on-dark/40 focus-within:border-on-dark"
      onSubmit={(e) => { e.preventDefault(); setDone(true); toast.success(footerCopy.newsletterThanks); }}
    >
      <label htmlFor="newsletter" className="sr-only">{footerCopy.newsletterLabel}</label>
      <input id="newsletter" type="email" required autoComplete="email" placeholder={footerCopy.newsletterLabel}
        className="h-12 min-w-0 flex-1 bg-transparent text-body-lg text-on-dark placeholder:text-on-dark/50 focus:outline-none" />
      <button type="submit" className="inline-flex h-12 items-center gap-2 pl-4 text-body font-medium">
        {footerCopy.newsletterCta} <ArrowRight className="size-4" aria-hidden />
      </button>
    </form>
  );
}
