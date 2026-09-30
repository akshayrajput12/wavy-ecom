"use client";

import { AlertCircle } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { cartCopy, checkoutCopy, FAILURE_STAGES } from "@/data/copy";
import { co } from "../copy";

/** Payment failed / dismissed: the order is kept (stock held), retry opens a fresh gateway attempt. */
export function PaymentFailure({ orderNumber, stage, retrying, onRetry, supportEmail }: {
  orderNumber: string; stage: string; retrying: boolean; onRetry: () => void; supportEmail?: string;
}) {
  return (
    <section role="alert" aria-labelledby="pf-h" className="grid gap-4 rounded-md border border-danger/30 bg-danger/5 p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-6 shrink-0 text-danger" aria-hidden />
        <div>
          <h3 id="pf-h" className="t-h3">{checkoutCopy.failureTitle}</h3>
          <p className="mt-1 text-body">{FAILURE_STAGES[stage] ?? FAILURE_STAGES.unknown}</p>
        </div>
      </div>
      <p className="text-meta text-ink-soft">{checkoutCopy.failureNoCharge}</p>
      <p className="text-meta">{co.reference}: <span className="font-semibold text-ink">{orderNumber}</span></p>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" onClick={onRetry} loading={retrying} className="max-sm:w-full">{checkoutCopy.retry}</Button>
        <ButtonLink href="/cart" variant="ghost" size="lg" className="max-sm:w-full">{cartCopy.viewBag}</ButtonLink>
      </div>
      {supportEmail && (
        <p className="text-meta text-ink-soft">
          {checkoutCopy.support}:{" "}
          <a className="text-ink underline underline-offset-4" href={`mailto:${supportEmail}?subject=${encodeURIComponent(`Payment issue ${orderNumber}`)}`}>{supportEmail}</a>
        </p>
      )}
    </section>
  );
}
