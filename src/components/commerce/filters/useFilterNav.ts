"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

/** Keys a "clear all" removes (everything except the search query). */
const REFINEMENTS = ["category", "opt", "brand", "min", "max", "inStock", "sort", "page"];

/**
 * URL-synced filters in the ProductQuery form (?opt=Color:Black&brand=X&min=&max=&inStock=1&sort=).
 * Every change resets pagination; the server component re-renders the grid.
 */
export function useFilterNav() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const push = (next: URLSearchParams) => {
    next.delete("page");
    const qs = next.toString();
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  return {
    pending,
    params: sp,
    /** Multi-value toggle (opt, brand). */
    toggle(key: string, value: string) {
      const next = new URLSearchParams(sp);
      const all = next.getAll(key);
      next.delete(key);
      for (const v of all.includes(value) ? all.filter((x) => x !== value) : [...all, value]) next.append(key, v);
      push(next);
    },
    /** Single values; `undefined` removes the key. */
    set(values: Record<string, string | undefined>) {
      const next = new URLSearchParams(sp);
      for (const [k, v] of Object.entries(values)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      push(next);
    },
    remove(key: string, value: string) {
      const next = new URLSearchParams(sp);
      const rest = next.getAll(key).filter((x) => x !== value);
      next.delete(key);
      rest.forEach((v) => next.append(key, v));
      push(next);
    },
    clear() {
      const next = new URLSearchParams(sp);
      REFINEMENTS.forEach((k) => next.delete(k));
      push(next);
    },
  };
}
