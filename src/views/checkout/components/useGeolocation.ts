"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GeoStatus = "idle" | "locating" | "refining" | "done" | "denied" | "unavailable" | "timeout" | "insecure" | "unsupported";
export type Fix = { lat: number; lng: number; accuracy: number };

const OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 };
const TRACK_MS = 20_000; // live tracking window after the first fix (battery: an address needs one good fix, not a trail)
const GOOD_ENOUGH_M = 10; // stop early once GPS-grade

/**
 * Live browser location: watchPosition until a GPS-grade fix or TRACK_MS after the first one, keeping the most accurate
 * reading. Laptops without GPS answer from Wi-Fi/IP, so `fix.accuracy` (metres) is always shown to the shopper.
 * `stop()` ends the watch (panel collapse); unmount stops it too.
 */
export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [fix, setFix] = useState<Fix | null>(null);
  const end = useRef(() => {});

  const stop = useCallback(() => {
    end.current();
    end.current = () => {};
    setStatus((s) => (s === "locating" ? "idle" : s === "refining" ? "done" : s));
  }, []);

  const locate = useCallback(() => {
    end.current();
    if (!window.isSecureContext) return setStatus("insecure"); // geolocation needs https or localhost
    if (!("geolocation" in navigator)) return setStatus("unsupported");
    const geo = navigator.geolocation;
    let best: Fix | null = null, timer = 0;
    const finish = () => { geo.clearWatch(watch); clearTimeout(timer); };
    const settle = () => { finish(); end.current = () => {}; setStatus("done"); };
    const watch = geo.watchPosition((p) => {
      const f = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy };
      if (!best) { timer = window.setTimeout(settle, TRACK_MS); setStatus("refining"); }
      if (!best || f.accuracy < best.accuracy) { best = f; setFix(f); }
      if (f.accuracy <= GOOD_ENOUGH_M) settle();
    }, (e) => {
      if (best) return; // a later timeout while refining: the best fix stands
      finish();
      end.current = () => {};
      setStatus(e.code === e.PERMISSION_DENIED ? "denied" : e.code === e.TIMEOUT ? "timeout" : "unavailable");
    }, OPTIONS);
    end.current = finish;
    setStatus("locating");
  }, []);

  useEffect(() => () => end.current(), []);
  return { status, fix, locate, stop };
}
