"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/States";
import { cartCopy } from "@/data/copy";
import { formatPrice } from "@/lib/format";
import { api } from "@/stores/http";
import type { ShippingMethod } from "@/types/domain";
import { co } from "../copy";

/** Delivery speeds for the destination state (GET /api/shipping/methods). Picks the first when none is chosen. */
export function ShippingOptions({ state, value, net, threshold, onChange }: {
  state?: string; value?: string; net: number; threshold?: number; onChange: (id: string) => void;
}) {
  const [res, setRes] = useState<{ state: string; methods?: ShippingMethod[]; failed?: boolean }>();

  useEffect(() => {
    if (!state) return;
    let live = true;
    void api<ShippingMethod[]>(`/api/shipping/methods?state=${encodeURIComponent(state)}`).then((r) => {
      if (live) setRes({ state, methods: r.ok ? r.data : undefined, failed: !r.ok });
    });
    return () => { live = false; };
  }, [state]);

  const methods = res && res.state === state ? res.methods : undefined;
  useEffect(() => {
    if (methods?.length && !methods.some((m) => m.id === value)) onChange(methods[0].id);
  }, [methods, value, onChange]);

  if (!state) return <p className="text-meta text-ink-soft">{co.delivery.methodsEmpty}</p>;
  if (res?.state === state && res.failed) return <p role="alert" className="text-meta text-danger">⚠ {co.delivery.methodsFailed}</p>;

  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-meta font-medium">{co.delivery.methods}</legend>
      {!methods ? (
        <div aria-label={co.delivery.methodsLoading} className="grid gap-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
      ) : methods.map((m) => {
        const free = (m.freeAbove ?? threshold) !== undefined && net >= (m.freeAbove ?? threshold ?? Infinity);
        return (
          <label key={m.id} className={clsx(
            "flex min-h-16 cursor-pointer items-center gap-3 rounded-md border bg-surface px-4 py-3 transition-colors",
            "has-[:checked]:border-ink has-[:checked]:bg-accent-soft has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus", "border-line hover:border-ink-muted",
          )}>
            <input type="radio" name="shipping" value={m.id} checked={value === m.id} onChange={() => onChange(m.id)} className="size-5 accent-ink" />
            <span className="flex-1 text-body">
              <span className="font-medium">{m.name}</span>
              <span className="block text-meta text-ink-soft">{co.delivery.days(m.minDays, m.maxDays)}{m.description ? ` · ${m.description}` : ""}</span>
            </span>
            <span className={clsx("text-body font-medium tabular-nums", free && "text-success")}>{free || !m.rate ? cartCopy.free : formatPrice(m.rate)}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
