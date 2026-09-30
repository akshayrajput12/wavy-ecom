"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// ponytail: one module-level instance; the app only ever mounts one SmoothScroll (root layout).
let lenis: Lenis | null = null;
let locks = 0;

/**
 * Body scroll lock shared by Drawer/Modal. Counts nested locks (e.g. Quick View opened from the cart)
 * and pauses Lenis while any overlay is open. Returns the unlock function.
 */
export function lockScroll(): () => void {
  if (locks++ === 0) {
    document.documentElement.style.overflow = "hidden";
    lenis?.stop();
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) {
      document.documentElement.style.overflow = "";
      lenis?.start();
    }
  };
}

/** Global Lenis smooth scrolling. Skipped for reduced-motion users and inside admin. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (location.pathname.startsWith("/admin")) return;
    const instance = new Lenis({ autoRaf: true, lerp: 0.1 });
    lenis = instance;
    if (locks > 0) instance.stop();
    return () => {
      instance.destroy();
      lenis = null;
    };
  }, []);
  return null;
}
