"use client";

import { useState } from "react";
import { MapPinIcon } from "@/components/ui/icons";
import { deliveryCopy as c } from "@/data/copy";

/** Pincode serviceability via GET /api/shipping/serviceability (Shiprocket). */
export function DeliveryCheck() {
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();
  const [loading, setLoading] = useState(false);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[1-9]\d{5}$/.test(pin)) return setMsg({ ok: false, text: c.invalid });
    setLoading(true);
    setMsg(undefined);
    try {
      const response = await fetch(`/api/shipping/serviceability?pincode=${encodeURIComponent(pin)}`, { cache: "no-store" });
      const payload = (await response.json()) as {
        ok?: boolean;
        data?: { serviceable: boolean; prepaidAvailable: boolean; codAvailable: boolean; estimatedDays: { min: number; max: number } | null };
      };
      if (!response.ok || !payload.ok || !payload.data) throw new Error("serviceability_unavailable");
      const availability = payload.data;
      if (!availability.serviceable) return setMsg({ ok: false, text: c.unserviceable });
      const days = availability.estimatedDays
        ? availability.estimatedDays.min === availability.estimatedDays.max
          ? `${availability.estimatedDays.min} days`
          : `${availability.estimatedDays.min}–${availability.estimatedDays.max} days`
        : null;
      const payment = availability.codAvailable ? c.codAvailable : c.prepaidOnly;
      setMsg({ ok: true, text: c.result(days, payment) });
    } catch {
      setMsg({ ok: false, text: c.unavailable });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={check} className="rounded-lg bg-surface-2 p-4" noValidate aria-busy={loading}>
      <label htmlFor="pincode" className="flex items-center gap-2 text-meta font-medium"><MapPinIcon className="size-4" /> {c.title}</label>
      <div className="mt-2 flex gap-2">
        <input
          id="pincode" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric" autoComplete="postal-code" placeholder={c.placeholder} aria-describedby={msg ? "pincode-msg" : undefined} aria-invalid={msg && !msg.ok}
          className="h-11 min-w-0 flex-1 rounded-pill border border-line bg-canvas px-4 text-body-lg tabular-nums focus:border-ink focus:outline-none sm:text-body"
        />
        <button type="submit" disabled={loading} className="h-11 min-w-20 rounded-pill bg-ink px-5 text-meta font-medium text-canvas transition-colors hover:bg-ink/85 disabled:opacity-60">{loading ? c.loading : c.cta}</button>
      </div>
      {msg && <p id="pincode-msg" role="status" className={msg.ok ? "mt-2 text-meta text-success" : "mt-2 text-meta text-danger"}>{msg.ok ? "✓ " : "⚠ "}{msg.text}</p>}
    </form>
  );
}
