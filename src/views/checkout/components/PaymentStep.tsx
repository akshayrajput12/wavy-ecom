"use client";

import { clsx } from "clsx";
import { Lock, RotateCcw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import type { PaymentOption } from "@/types/domain";
import { co } from "../copy";

export type Provider = "razorpay" | "cod";
const p = co.payment;

/** Why an option can't be used for this total (client hint; the quote/checkout re-check on the server). */
const blocked = (o: PaymentOption, total?: number) =>
  total === undefined ? undefined
    : o.maxAmount !== undefined && total > o.maxAmount ? p.above(formatPrice(o.maxAmount))
    : o.minAmount !== undefined && total < o.minAmount ? p.below(formatPrice(o.minAmount))
    : undefined;

export function PaymentStep({ options, value, onChange, total, codFee, error, busy, busyLabel, disabled, onPay, returnDays }: {
  options: PaymentOption[]; value?: Provider; onChange: (v: Provider) => void; total?: number; codFee?: number;
  error?: string; busy: boolean; busyLabel?: string; disabled: boolean; onPay: () => void; returnDays?: number;
}) {
  const usable = options.filter((o): o is PaymentOption & { provider: Provider } => o.provider === "razorpay" || o.provider === "cod");
  return (
    <div className="grid gap-4">
      {usable.length === 0 && <p role="alert" className="text-body text-danger">⚠ {p.noGateway}</p>}
      <fieldset className="grid gap-2">
        <legend className="sr-only">{p.legend}</legend>
        {usable.map((o) => {
          const reason = blocked(o, total);
          return (
            <label key={o.provider} className={clsx(
              "flex min-h-16 items-start gap-3 rounded-md border border-line bg-surface p-4 transition-colors",
              reason ? "cursor-not-allowed bg-surface-warm" : "cursor-pointer hover:border-ink-muted has-[:checked]:border-ink has-[:checked]:bg-accent-soft",
            )}>
              <input type="radio" name="payment" value={o.provider} disabled={!!reason} checked={value === o.provider}
                onChange={() => onChange(o.provider)} className="mt-0.5 size-5 accent-ink" />
              <span className="flex-1 text-body">
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {o.displayName}{reason && <Badge tone="warning" dot>{p.unavailable}</Badge>}
                </span>
                <span className="block text-meta text-ink-soft">{reason ?? o.description}</span>
                {!reason && o.provider === "razorpay" && o.supportedMethods.length > 0 && (
                  <span className="mt-2 flex flex-wrap gap-1.5">{o.supportedMethods.map((m) => <Badge key={m}>{p.methods[m] ?? m}</Badge>)}</span>
                )}
                {!reason && o.provider === "cod" && !!codFee && <span className="block text-meta">{p.fee(formatPrice(codFee))}</span>}
              </span>
            </label>
          );
        })}
      </fieldset>
      {error && <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-body text-danger">⚠ {error}</p>}
      <Button size="lg" full loading={busy} disabled={disabled || !value} onClick={onPay}>
        <Lock className="size-4" aria-hidden />
        {busy && busyLabel ? busyLabel : total === undefined ? p.legend : value === "cod" ? p.placeCod(formatPrice(total)) : p.pay(formatPrice(total))}
      </Button>
      <ul className="grid gap-2 text-meta text-ink-soft sm:grid-cols-3">
        <li className="flex items-center gap-2"><Lock className="size-4 shrink-0 text-accent-deep" aria-hidden /> {co.trust.secure}</li>
        <li className="flex items-center gap-2"><ShieldCheck className="size-4 shrink-0 text-accent-deep" aria-hidden /> {co.trust.razorpay}</li>
        {!!returnDays && <li className="flex items-center gap-2"><RotateCcw className="size-4 shrink-0 text-accent-deep" aria-hidden /> {co.trust.returns(returnDays)}</li>}
      </ul>
    </div>
  );
}
