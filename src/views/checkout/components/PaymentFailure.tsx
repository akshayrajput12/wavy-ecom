"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { checkoutCopy, FAILURE_STAGES, type FailureStage } from "@/data/checkout";
import { site } from "@/data/site";

export function PaymentFailure({ orderNumber, stage, retrying, onRetry, onChangeMethod }: {
  orderNumber: string; stage: FailureStage; retrying: boolean; onRetry: () => void; onChangeMethod: () => void;
}) {
  return (
    <section role="alert" aria-labelledby="pf-h" className="grid gap-5 rounded-md border border-danger/30 bg-surface p-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-1 size-6 shrink-0 text-danger" aria-hidden />
        <div>
          <h2 id="pf-h" className="t-h2">{checkoutCopy.failureTitle}</h2>
          <p className="mt-1 text-body-lg">{FAILURE_STAGES[stage]}</p>
        </div>
      </div>
      <p className="text-body text-ink-soft">{checkoutCopy.failureNoCharge}</p>
      <p className="t-meta">Order reference: <span className="font-semibold text-ink">{orderNumber}</span></p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onRetry} loading={retrying}>{checkoutCopy.retry}</Button>
        <Button variant="secondary" onClick={onChangeMethod} disabled={retrying}>{checkoutCopy.otherMethod}</Button>
      </div>
      <p className="text-body text-ink-soft">
        {checkoutCopy.support}:{" "}
        <a className="text-ink underline underline-offset-4" href={`mailto:${site.supportEmail}?subject=Payment%20issue%20${orderNumber}`}>
          {site.supportEmail}
        </a>
      </p>
    </section>
  );
}
