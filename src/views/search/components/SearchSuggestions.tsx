"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Clock } from "lucide-react";
import { addRecentSearch, clearRecentSearches, useRecentSearches } from "@/components/layout/recentSearches";
import { searchCopy } from "@/data/copy";

const chip = "inline-flex min-h-11 items-center gap-2 rounded-pill border border-line px-4 text-meta font-medium transition-colors hover:border-ink";

/** Saves the submitted query to this device's recent searches. */
export function RecordSearch({ q }: { q: string }) {
  useEffect(() => addRecentSearch(q), [q]);
  return null;
}

/** Recent searches on this device (nothing renders until there are some). */
export function SearchSuggestions() {
  const recent = useRecentSearches();
  if (!recent.length) return null;
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="t-overline text-ink-soft">{searchCopy.recentTitle}</h2>
        <button type="button" className="min-h-11 text-meta underline decoration-line underline-offset-4 hover:decoration-ink" onClick={clearRecentSearches}>{searchCopy.clearRecent}</button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-2">
        {recent.map((r) => (
          <li key={r}><Link href={`/search?q=${encodeURIComponent(r)}`} className={chip}><Clock className="size-3.5 text-ink-soft" aria-hidden />{r}</Link></li>
        ))}
      </ul>
    </div>
  );
}
