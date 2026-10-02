import { useSyncExternalStore } from "react";

/** This device's recent searches (localStorage, every access guarded), shared by the header typeahead and /search. */
const KEY = "wavy-recent-searches";
const EVENT = "wavy:recent-searches";
const MAX = 6;

const read = () => { try { return localStorage.getItem(KEY) ?? "[]"; } catch { return "[]"; } };
const write = (list: string[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event(EVENT));
};
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => { window.removeEventListener(EVENT, cb); window.removeEventListener("storage", cb); };
};
const parse = (raw: string): string[] => {
  try { const v: unknown = JSON.parse(raw); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; } catch { return []; }
};

export function addRecentSearch(q: string) {
  const term = q.trim().toLowerCase();
  if (term) write([term, ...parse(read()).filter((x) => x !== term)].slice(0, MAX));
}
export const clearRecentSearches = () => write([]);

/** Subscribes to the list; [] on the server and when storage is blocked. */
export function useRecentSearches(): string[] {
  return parse(useSyncExternalStore(subscribe, read, () => "[]"));
}
