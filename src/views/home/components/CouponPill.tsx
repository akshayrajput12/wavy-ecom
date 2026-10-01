"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { homeCopy } from "@/data/storefront";

/** Outlined pill that copies a coupon code; the result is announced. */
export function CouponPill({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked: the code stays visible to copy by hand
    }
  };
  return (
    <button type="button" onClick={copy} aria-label={`${homeCopy.copyCode}: ${code}`} className={buttonClass({ variant: "secondary", size: "lg" })}>
      <span className="opacity-70">{homeCopy.useCode}</span>
      <span className="font-semibold tracking-wide">{code}</span>
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      <span className="sr-only" role="status">{copied ? homeCopy.copied : ""}</span>
    </button>
  );
}
