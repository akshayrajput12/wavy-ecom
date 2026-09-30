"use client";

import { clsx } from "clsx";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { COD_LIMIT, type PaymentMethod } from "@/data/checkout";
import { formatPrice } from "@/lib/format";

/** Reason a method can't be picked right now, or undefined if it can. */
export const unavailable = (m: PaymentMethod, total: number) =>
  !m.enabled ? (m.unavailableReason ?? "Temporarily unavailable")
  : m.provider === "cod" && total > COD_LIMIT ? `Not available for orders above ${formatPrice(COD_LIMIT)}`
  : undefined;

export function PaymentStep({ methods, value, onChange, total, placing, onPlace }: {
  methods: PaymentMethod[]; value?: string; onChange: (id: string) => void;
  total: number; placing: boolean; onPlace: () => void;
}) {
  return (
    <div className="grid gap-4">
      <fieldset className="grid gap-2">
        <legend className="sr-only">Payment method</legend>
        {methods.map((m) => {
          const reason = unavailable(m, total);
          return (
            <label
              key={m.id}
              className={clsx(
                "flex items-start gap-3 rounded-sm border border-line bg-surface p-4",
                reason ? "cursor-not-allowed bg-surface-warm" : "cursor-pointer has-[:checked]:border-ink",
              )}
            >
              <input type="radio" name="payment" value={m.id} disabled={!!reason} checked={value === m.id}
                onChange={() => onChange(m.id)} className="mt-1 accent-ink" aria-describedby={`pm-${m.id}`} />
              <span className="flex-1 text-body" id={`pm-${m.id}`}>
                <span className="flex flex-wrap items-center gap-2 font-medium">
                  {m.label}
                  {m.badge && !reason && <Badge tone="accent">{m.badge}</Badge>}
                  {reason && <Badge tone="warning" dot>Unavailable</Badge>}
                </span>
                <span className="block text-ink-soft">{reason ?? m.description}</span>
                {!!m.fee && !reason && <span className="block t-meta">+ {formatPrice(m.fee)} handling fee</span>}
              </span>
            </label>
          );
        })}
      </fieldset>
      <Button size="lg" full loading={placing} disabled={!value} onClick={onPlace}>
        <Lock className="size-4" aria-hidden />
        {value === "cod" ? `Place order · ${formatPrice(total)}` : `Pay ${formatPrice(total)} & place order`}
      </Button>
      <p className="text-center t-meta">Payments are encrypted and processed by RBI-regulated gateways. We never store card details.</p>
    </div>
  );
}
