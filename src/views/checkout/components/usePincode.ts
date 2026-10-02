"use client";

import { useEffect, useState } from "react";
import type { PincodeInfo as GeoPin } from "@/backend/geo/normalise";
import type { Serviceability } from "@/backend/shipping/serviceability";
import { api } from "@/stores/http";

/** `geo`: the India Post lookup, "not_found" (no such PIN) or "failed" (lookup down: the form stays manual). */
export type PincodeInfo = { pin: string; geo: GeoPin | "not_found" | "failed"; service?: Serviceability };

/** For a complete pincode: delivery check (GET /api/shipping/serviceability) + state/district/localities (GET /api/geo/pincode/[pin]). */
export function usePincode(pin?: string) {
  const [info, setInfo] = useState<PincodeInfo>();
  const valid = !!pin && /^[1-9]\d{5}$/.test(pin);

  useEffect(() => {
    if (!valid || !pin) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      const [svc, geo] = await Promise.all([
        api<Serviceability>(`/api/shipping/serviceability?pincode=${pin}`, { signal: ctl.signal }),
        api<GeoPin>(`/api/geo/pincode/${pin}`, { signal: ctl.signal }),
      ]);
      if (ctl.signal.aborted) return;
      setInfo({ pin, geo: geo.ok ? geo.data : geo.status === 404 ? "not_found" : "failed", service: svc.ok ? svc.data : undefined });
    }, 300);
    return () => { ctl.abort(); clearTimeout(t); };
  }, [pin, valid]);

  const current = valid && info?.pin === pin ? info : undefined;
  return { info: current, loading: valid && !current };
}
