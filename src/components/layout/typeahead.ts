/**
 * Framework-free typeahead engine: debounce, abort of in-flight requests, a small LRU of recent answers.
 * Pure (timers + AbortController only); `useTypeahead` in SearchBox wires it to React.
 */

export const MIN_CHARS = 2;
export const MAX_CHARS = 60; // mirrors searchTerm() on the server

/** Trim, collapse whitespace, lowercase, cap: "  Black  Tee " and "black tee" share one request and cache entry. */
export const normaliseQuery = (q: string) => q.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase().slice(0, MAX_CHARS);

export type TypeaheadState<T> =
  | { status: "idle"; query: string; data: null }
  | { status: "loading"; query: string; data: T | null } // data = previous answer, kept on screen while waiting
  | { status: "ready"; query: string; data: T }
  | { status: "error"; query: string; data: null };

export interface TypeaheadOptions<T> {
  fetcher: (query: string, signal: AbortSignal) => Promise<T>;
  onChange: (state: TypeaheadState<T>) => void;
  debounceMs?: number;
  /** Loading only shows once a request has been out this long (no flash on fast answers). */
  loadingDelayMs?: number;
  cacheSize?: number;
  /** Pass a long-lived Map to share answers across instances. */
  cache?: Map<string, T>;
}

export function createTypeahead<T>({ fetcher, onChange, debounceMs = 220, loadingDelayMs = 150, cacheSize = 30, cache = new Map() }: TypeaheadOptions<T>) {
  // Map insertion order = recency (LRU)
  let latest = "";
  let last: T | null = null;
  let debounce: ReturnType<typeof setTimeout> | undefined;
  let slow: ReturnType<typeof setTimeout> | undefined;
  let ctrl: AbortController | null = null;

  const cancel = () => { clearTimeout(debounce); clearTimeout(slow); ctrl?.abort(); ctrl = null; };
  const ready = (query: string, data: T) => { last = data; onChange({ status: "ready", query, data }); };

  async function run(query: string) {
    const c = new AbortController();
    ctrl = c;
    slow = setTimeout(() => onChange({ status: "loading", query, data: last }), loadingDelayMs);
    try {
      const data = await fetcher(query, c.signal);
      if (c.signal.aborted || query !== latest) return; // a newer query owns the screen
      cache.set(query, data);
      if (cache.size > cacheSize) cache.delete(cache.keys().next().value as string);
      ready(query, data);
    } catch {
      if (c.signal.aborted || query !== latest) return;
      onChange({ status: "error", query, data: null });
    } finally {
      if (ctrl === c) { clearTimeout(slow); ctrl = null; }
    }
  }

  return {
    /** Feed every keystroke. Returns the normalised query. */
    set(raw: string): string {
      const query = normaliseQuery(raw);
      if (query === latest) return query;
      latest = query;
      cancel();
      if (query.length < MIN_CHARS) { onChange({ status: "idle", query, data: null }); return query; }
      const hit = cache.get(query);
      if (hit !== undefined) { cache.delete(query); cache.set(query, hit); ready(query, hit); return query; }
      debounce = setTimeout(() => void run(query), debounceMs);
      return query;
    },
    /** Retry the current query now (error state "Try again"). */
    retry() { const q = latest; if (q.length < MIN_CHARS) return; cancel(); void run(q); },
    dispose: cancel,
  };
}
