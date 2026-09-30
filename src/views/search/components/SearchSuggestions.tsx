"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { Clock, TrendingUp } from "lucide-react";
import { searchCopy } from "@/data/content";

const KEY = "wavy-recent-searches";
const EVENT = "wavy:recent-searches";

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
const parse = (raw: string): string[] => { try { const v: unknown = JSON.parse(raw); return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []; } catch { return []; } };

const chip = "inline-flex min-h-10 items-center gap-2 rounded-pill border border-line bg-surface px-4 text-body hover:border-ink";

/** Saves the submitted query to this device's recent searches. */
export function RecordSearch({ q }: { q: string }) {
  useEffect(() => {
    const term = q.trim().toLowerCase();
    if (term) write([term, ...parse(read()).filter((x) => x !== term)].slice(0, 6));
  }, [q]);
  return null;
}

/** Recent (this device) + popular searches. */
export function SearchSuggestions() {
  const recent = parse(useSyncExternalStore(subscribe, read, () => "[]"));

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <h2 className="t-overline text-ink-soft">{searchCopy.recentTitle}</h2>
            <button type="button" className="min-h-9 text-meta underline underline-offset-4" onClick={() => write([])}>{searchCopy.clearRecent}</button>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {recent.map((r) => (
              <li key={r}><Link href={`/search?q=${encodeURIComponent(r)}`} className={chip}><Clock className="size-3.5 text-ink-soft" aria-hidden />{r}</Link></li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <h2 className="t-overline text-ink-soft">{searchCopy.popularTitle}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {searchCopy.popular.map((p) => (
            <li key={p}><Link href={`/search?q=${encodeURIComponent(p)}`} className={chip}><TrendingUp className="size-3.5 text-ink-soft" aria-hidden />{p}</Link></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
