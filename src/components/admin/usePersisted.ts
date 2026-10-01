"use client";

import { useCallback, useSyncExternalStore } from "react";

// ponytail: in-memory copy wins after the first write, so the UI still works when localStorage throws
// (private mode, blocked storage). Cost: a tab stops following other tabs' changes once it has written.
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); window.removeEventListener("storage", cb); };
}

function read(key: string): string | null {
  if (memory.has(key)) return memory.get(key) ?? null;
  try { return localStorage.getItem(key); } catch { return null; }
}

/**
 * A string persisted in localStorage. Returns null on the server and during hydration
 * (server snapshot), so the first client render always matches the server HTML.
 */
export function usePersisted(key: string): [string | null, (value: string) => void] {
  const value = useSyncExternalStore(subscribe, () => read(key), () => null);
  const set = useCallback((v: string) => {
    memory.set(key, v);
    try { localStorage.setItem(key, v); } catch { /* storage blocked: memory copy keeps it for this tab */ }
    listeners.forEach((l) => l());
  }, [key]);
  return [value, set];
}
