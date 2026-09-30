"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Global Lenis smooth scrolling. Skipped for reduced-motion users and inside admin. */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (location.pathname.startsWith("/admin")) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.12 });
    return () => lenis.destroy();
  }, []);
  return null;
}
