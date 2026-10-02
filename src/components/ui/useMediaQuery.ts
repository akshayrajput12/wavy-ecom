"use client";

import { useSyncExternalStore } from "react";

/** Live `matchMedia` result. False on the server and before hydration. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * prefers-reduced-motion, hydration-safe: false on the server and while hydrating (so the markup matches the SSR HTML),
 * then live. Use this, not framer-motion's hook, which reads matchMedia on the first client render and breaks hydration.
 * Framer's own animations also honour the setting through <MotionConfig reducedMotion="user"> in the root layout.
 */
export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
