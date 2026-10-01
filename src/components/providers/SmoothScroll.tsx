"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
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

/**
 * Global Lenis smooth scrolling (wheel only; touch stays native). Follows client navigation: destroyed inside /admin,
 * recreated outside it. Skipped for reduced-motion users. New pages start at the top; back/forward and #hash
 * navigations keep the browser's position.
 */
export function SmoothScroll() {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  const prev = useRef(pathname);
  const popped = useRef(false);

  useEffect(() => {
    if (admin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
    const instance = new Lenis({
      autoRaf: true, lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true, syncTouch: false,
      anchors: { offset: -header }, stopInertiaOnNavigate: true,
    });
    lenis = instance;
    if (locks > 0) instance.stop();
    const onPop = () => { popped.current = true; };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      instance.destroy();
      lenis = null;
    };
  }, [admin]);

  useEffect(() => {
    if (prev.current === pathname) return;
    prev.current = pathname;
    const keep = popped.current || !!location.hash;
    popped.current = false;
    // Next scrolls the window itself; this resyncs Lenis so it doesn't glide back to the old position.
    if (!keep) lenis?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);
  return null;
}
