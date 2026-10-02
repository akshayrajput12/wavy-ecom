"use client";

import Form from "next/form";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { clsx } from "clsx";
import { SearchIcon } from "@/components/ui/icons";
import { searchCopy } from "@/data/copy";
import { layoutCopy } from "@/data/storefront";
import type { SearchSuggestions } from "@/backend/catalog/repo";
import { addRecentSearch, clearRecentSearches, useRecentSearches } from "./recentSearches";
import { SearchResults, suggestionGroups, type SuggestOption } from "./SearchResults";
import { createTypeahead, MIN_CHARS, normaliseQuery, type TypeaheadState } from "./typeahead";

async function fetchSuggestions(q: string, signal: AbortSignal): Promise<SearchSuggestions> {
  const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal });
  const json = (await res.json()) as { ok: boolean; data?: SearchSuggestions };
  if (!res.ok || !json.ok || !json.data) throw new Error(`suggest ${res.status}`);
  return json.data;
}

// Shared by every box (header modal, mobile menu, /search), so reopening search on a known query is instant.
// ponytail: lives for the tab (30 entries, LRU); prices here are a preview, the PDP and cart are authoritative.
const cache = new Map<string, SearchSuggestions>();

function useTypeahead() {
  const [state, setState] = useState<TypeaheadState<SearchSuggestions>>({ status: "idle", query: "", data: null });
  const [engine] = useState(() => createTypeahead({ fetcher: fetchSuggestions, onChange: setState, cache }));
  useEffect(() => engine.dispose, [engine]);
  return [state, engine] as const;
}

/**
 * Search combobox with live grouped suggestions (GET /api/search/suggest, debounced + aborted + cached in
 * typeahead.ts). Submits to /search?q= and works without JS. ↑/↓ move, Enter opens, Escape closes the list.
 */
export function SearchBox({ defaultValue = "", autoFocus, onNavigate, large, recent: showRecent = true }: {
  defaultValue?: string; autoFocus?: boolean; onNavigate?: () => void; large?: boolean; recent?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [state, engine] = useTypeahead();
  const recent = useRecentSearches();
  const [focused, setFocused] = useState(false);
  const [closed, setClosed] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const term = normaliseQuery(q);
  const edited = term !== normaliseQuery(defaultValue); // /search already shows results for its own query

  // After the dialog's showModal() has moved focus to its first control (React's autoFocus runs before it).
  useEffect(() => {
    if (!autoFocus) return;
    const raf = requestAnimationFrame(() => input.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [autoFocus]);

  const typing = term.length >= MIN_CHARS && edited && state.status !== "idle";
  const groups = !term && showRecent ? suggestionGroups("", null, recent) : typing ? suggestionGroups(term, state.data, []) : [];
  const options = groups.flatMap((g) => g.items);
  const open = focused && !closed && (options.length > 0 || typing);
  const optionId = (i: number) => `${id}-o${i}`;
  const empty = state.status === "ready" && !state.data.products.length && !state.data.categories.length && !state.data.collections.length;

  const choose = (o: SuggestOption) => { addRecentSearch(o.recent ? o.label : term); onNavigate?.(); };
  const move = (next: number) => { setActive(next); document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" }); };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = options.length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) { setClosed(false); return; }
      if (n) move(e.key === "ArrowDown" ? (active + 1) % n : active <= 0 ? n - 1 : active - 1);
    } else if (e.key === "Enter" && open && options[active]) {
      e.preventDefault();
      choose(options[active]);
      router.push(options[active].href);
    } else if (e.key === "Escape" && open) {
      e.preventDefault(); // keep a surrounding dialog open: this Escape only closes the list
      setClosed(true); setActive(-1);
    }
  };

  return (
    <div
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setFocused(false); setActive(-1); } }}
    >
      <Form action="/search" role="search" onSubmit={onNavigate}
        className={clsx("flex items-center gap-3 border-b-2 border-ink/25 pb-2 transition-colors focus-within:border-ink", large && "pb-3")}>
        <SearchIcon className={clsx("shrink-0 text-ink-soft", large ? "size-6" : "size-5")} strokeWidth={1.5} />
        <label htmlFor={`${id}-q`} className="sr-only">{searchCopy.label}</label>
        <input
          ref={input} id={`${id}-q`} name="q" type="search" value={q} autoFocus={autoFocus} maxLength={100}
          onChange={(e) => { setQ(e.target.value); engine.set(e.target.value); setActive(-1); setClosed(false); }}
          onKeyDown={onKey} placeholder={searchCopy.placeholder} autoComplete="off" spellCheck={false}
          role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`}
          aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
          className={clsx("min-w-0 flex-1 bg-transparent placeholder:text-ink-muted focus:outline-none", large ? "text-h2" : "text-body-lg")}
        />
        <button type="submit" className="h-11 shrink-0 rounded-pill bg-ink px-5 text-body font-medium text-on-dark transition-colors hover:bg-black">{searchCopy.submit}</button>
      </Form>

      {/* mousedown would blur the input and hide the list before the click lands (Safari never focuses links) */}
      <div className="mt-4" hidden={!open} onMouseDown={(e) => e.preventDefault()}>
        {!term && (
          <div className="mb-1 flex items-center justify-between px-2">
            <p className="t-overline text-ink-soft">{searchCopy.recentTitle}</p>
            <button type="button" onClick={clearRecentSearches} className="min-h-11 text-meta underline decoration-line underline-offset-4 hover:decoration-ink">{searchCopy.clearRecent}</button>
          </div>
        )}
        {typing && state.status === "loading" && !state.data && <p className="px-2 text-meta text-ink-soft">{layoutCopy.searching}</p>}
        {typing && state.status === "error" && (
          <p className="flex flex-wrap items-center gap-x-3 px-2 text-meta text-ink-soft">
            {layoutCopy.searchError}
            <button type="button" onClick={() => engine.retry()} className="min-h-11 font-medium text-ink underline underline-offset-4">{layoutCopy.retry}</button>
          </p>
        )}
        {typing && empty && <p className="mb-2 px-2 text-meta text-ink-soft">{layoutCopy.noSuggestions}</p>}
        <SearchResults id={`${id}-list`} groups={groups} active={active} optionId={optionId} term={term}
          busy={state.status === "loading"} onChoose={choose} />
      </div>
      <p className="sr-only" aria-live="polite">{open && state.status === "ready" ? layoutCopy.suggestionCount(options.length) : ""}</p>
    </div>
  );
}
