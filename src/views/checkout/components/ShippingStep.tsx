"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FREE_SHIPPING_THRESHOLD, type ShippingMethod } from "@/data/checkout";
import { formatPrice } from "@/lib/format";

export function ShippingStep({ methods, value, net, onDone }: {
  methods: ShippingMethod[]; value?: string; /** subtotal after discounts */ net: number; onDone: (id: string) => void;
}) {
  const [picked, setPicked] = useState(value ?? methods[0]?.id);
  const freeEligible = net >= FREE_SHIPPING_THRESHOLD;

  return (
    <div className="grid gap-4">
      <p className="text-body text-ink-soft" role="status">
        {freeEligible
          ? "Your order qualifies for free standard delivery."
          : `Add ${formatPrice(FREE_SHIPPING_THRESHOLD - net)} more for free standard delivery.`}
      </p>
      <fieldset className="grid gap-2">
        <legend className="sr-only">Shipping method</legend>
        {methods.map((m) => {
          const cost = m.freeAboveThreshold && freeEligible ? 0 : m.cost;
          return (
            <label key={m.id} className="flex cursor-pointer items-start gap-3 rounded-sm border border-line bg-surface p-4 has-[:checked]:border-ink">
              <input type="radio" name="shipping" value={m.id} checked={picked === m.id} onChange={() => setPicked(m.id)} className="mt-1 accent-ink" />
              <span className="flex-1 text-body">
                <span className="font-medium">{m.label}</span>
                <span className="block text-ink-soft">{m.eta}</span>
              </span>
              <span className="text-body font-medium">{cost ? formatPrice(cost) : "Free"}</span>
            </label>
          );
        })}
      </fieldset>
      <Button className="justify-self-start" disabled={!picked} onClick={() => picked && onDone(picked)}>Continue to payment</Button>
    </div>
  );
}
