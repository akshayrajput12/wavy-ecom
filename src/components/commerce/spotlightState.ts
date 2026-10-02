import type { MotionValue } from "framer-motion";

/** FloatingProductCard persistence: session dismiss + minimised state, remembered position. Every storage access is guarded. */
const POS_KEY = "wavy-spotlight-pos";
const DISMISS_KEY = "wavy-spotlight-dismissed";
const MIN_KEY = "wavy-spotlight-min";
const DISMISS_EVENT = "wavy:spotlight-dismissed";

let closed = false; // in-memory fallback when sessionStorage is blocked
export const isDismissed = () => { if (closed) return true; try { return sessionStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; } };
export const dismiss = () => {
  closed = true;
  try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* storage blocked: closed until reload */ }
  window.dispatchEvent(new Event(DISMISS_EVENT));
};
export const onDismiss = (cb: () => void) => { window.addEventListener(DISMISS_EVENT, cb); return () => window.removeEventListener(DISMISS_EVENT, cb); };
export const onVisibility = (cb: () => void) => { document.addEventListener("visibilitychange", cb); return () => document.removeEventListener("visibilitychange", cb); };

/** Saved choice for this session, else minimised below md so the bubble never sits on mobile content. */
export const readMinimised = () => {
  try { const v = sessionStorage.getItem(MIN_KEY); if (v) return v === "1"; } catch { /* storage blocked */ }
  return window.matchMedia("(max-width: 767px)").matches;
};
export const saveMinimised = (v: boolean) => { try { sessionStorage.setItem(MIN_KEY, v ? "1" : "0"); } catch { /* storage blocked */ } };

export const readPos = (): { x: number; y: number } | null => {
  try {
    const p: unknown = JSON.parse(localStorage.getItem(POS_KEY) ?? "null");
    return p && typeof p === "object" && "x" in p && "y" in p && typeof p.x === "number" && typeof p.y === "number" ? { x: p.x, y: p.y } : null;
  } catch { return null; }
};
export const savePos = (x: number, y: number) => { try { localStorage.setItem(POS_KEY, JSON.stringify({ x, y })); } catch { /* storage blocked */ } };

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

/** Fixed header's height (--header-h): the card stays below it, or the header (z-40) covers its controls. */
const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;

/** Moves the card to offset (nx, ny), kept inside the viewport below the header. Assumes the current offset is already painted. */
export function place(el: HTMLElement | null, x: MotionValue<number>, y: MotionValue<number>, nx = x.get(), ny = y.get()) {
  const r = el?.getBoundingClientRect();
  if (!r?.width) { x.set(nx); y.set(ny); return; } // hidden (display: none): nothing to measure yet
  const left = r.left - x.get(), top = r.top - y.get();
  x.set(clamp(nx, -left, window.innerWidth - left - r.width));
  y.set(clamp(ny, Math.min(headerH(), window.innerHeight - r.height) - top, window.innerHeight - top - r.height));
}
