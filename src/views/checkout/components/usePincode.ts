"use client";

import { useEffect, useState } from "react";
import type { Serviceability } from "@/backend/shipping/serviceability";
import { INDIAN_STATES } from "@/data/copy";
import { api } from "@/stores/http";

export type PincodeInfo = { pin: string; city?: string; state?: (typeof INDIAN_STATES)[number]; service?: Serviceability };

/**
 * For a complete pincode: delivery check via GET /api/shipping/serviceability, plus city/state lookup.
 * ponytail: serviceability does not return city/state, so the lookup uses India Post's public API
 * (best effort, silently skipped when down); move it server-side if a pincode table lands in the DB.
 */
export function usePincode(pin?: string) {
  const [info, setInfo] = useState<PincodeInfo>();
  const valid = !!pin && /^[1-9]\d{5}$/.test(pin);

  useEffect(() => {
    if (!valid || !pin) return;
    let live = true;
    const t = setTimeout(async () => {
      const [svc, post] = await Promise.all([
        api<Serviceability>(`/api/shipping/serviceability?pincode=${pin}`),
        fetch(`https://api.postalpincode.in/pincode/${pin}`).then((r) => r.json() as Promise<unknown>).catch(() => null),
      ]);
      const office = Array.isArray(post) ? (post[0] as { PostOffice?: { District?: string; State?: string }[] } | undefined)?.PostOffice?.[0] : undefined;
      const state = INDIAN_STATES.find((s) => s.toLowerCase() === office?.State?.toLowerCase());
      if (live) setInfo({ pin, city: office?.District, state, service: svc.ok ? svc.data : undefined });
    }, 300);
    return () => { live = false; clearTimeout(t); };
  }, [pin, valid]);

  const current = valid && info?.pin === pin ? info : undefined;
  return { info: current, loading: valid && !current };
}
