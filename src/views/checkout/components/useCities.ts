"use client";

import { useEffect, useState } from "react";
import { api } from "@/stores/http";

const memo = new Map<string, string[]>();

/** Districts for the chosen state (GET /api/geo/states/[state]/cities), memoised per page load. Empty while loading or on failure. */
export function useCities(state?: string) {
  const [lists, setLists] = useState<Record<string, string[]>>({});
  const cities = state ? memo.get(state) ?? lists[state] : undefined;

  useEffect(() => {
    if (!state || memo.has(state)) return;
    const ctl = new AbortController();
    api<{ cities: string[] }>(`/api/geo/states/${encodeURIComponent(state)}/cities`, { signal: ctl.signal }).then((r) => {
      if (ctl.signal.aborted) return;
      if (r.ok) memo.set(state, r.data.cities);
      setLists((l) => ({ ...l, [state]: r.ok ? r.data.cities : [] })); // failure: free-text city only
    });
    return () => ctl.abort();
  }, [state]);

  return { cities: cities ?? [], loading: !!state && !cities };
}
