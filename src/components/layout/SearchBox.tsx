"use client";

import Form from "next/form";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { clsx } from "clsx";
import { Search } from "lucide-react";
import { ImageWell } from "@/components/commerce/ImageWell";
import { searchCopy } from "@/data/copy";
import { layoutCopy } from "@/data/storefront";
import { formatPrice } from "@/lib/format";
import type { SearchSuggestions } from "@/backend/catalog/repo";

const MIN_CHARS = 2;

/** Search field with live suggestions (GET /api/search/suggest). Submits to /search?q= and works without JS. */
export function SearchBox({ defaultValue = "", autoFocus, onNavigate, large }: {
  defaultValue?: string; autoFocus?: boolean; onNavigate?: () => void; large?: boolean;
}) {
  const [q, setQ] = useState(defaultValue);
  const [data, setData] = useState<SearchSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const listId = useId();
  const term = q.trim();
  const show = term.length >= MIN_CHARS && term !== defaultValue.trim();

  useEffect(() => {
    if (!show) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = (await res.json()) as { ok: boolean; data?: SearchSuggestions };
        setData(json.ok && json.data ? json.data : null);
      } catch {
        if (!ctrl.signal.aborted) setData(null);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { ctrl.abort(); window.clearTimeout(t); };
  }, [term, show]);

  const empty = data && !data.products.length && !data.categories.length && !data.collections.length;
  const link = "flex min-h-11 items-center gap-3 rounded-sm px-2 transition-colors hover:bg-surface-warm";

  return (
    <div>
      <Form action="/search" role="search" onSubmit={onNavigate}
        className={clsx("flex items-center gap-3 border-b-2 border-ink pb-2 focus-within:border-accent-deep", large && "pb-3")}>
        <Search className={clsx("shrink-0 text-ink-soft", large ? "size-6" : "size-5")} strokeWidth={1.5} aria-hidden />
        <label htmlFor={`${listId}-q`} className="sr-only">{searchCopy.label}</label>
        <input
          id={`${listId}-q`} name="q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoFocus={autoFocus}
          placeholder={searchCopy.placeholder} autoComplete="off" aria-controls={listId} maxLength={100}
          className={clsx("min-w-0 flex-1 bg-transparent placeholder:text-ink-muted focus:outline-none", large ? "text-h2" : "text-body-lg")}
        />
        <button type="submit" className="h-11 rounded-pill bg-ink px-5 text-body font-medium text-on-dark transition-colors hover:bg-black">{searchCopy.submit}</button>
      </Form>

      <div id={listId} aria-live="polite" className="mt-4">
        {show && loading && !data && <p className="text-meta text-ink-soft">{layoutCopy.searching}</p>}
        {show && empty && <p className="text-meta text-ink-soft">{layoutCopy.noSuggestions}</p>}
        {show && data && !empty && (
          <div className="grid gap-6 sm:grid-cols-[2fr_1fr]">
            {data.products.length > 0 && (
              <section>
                <h2 className="t-overline mb-2 text-ink-soft">{searchCopy.suggestionsProducts}</h2>
                <ul>
                  {data.products.map((p) => (
                    <li key={p.id}>
                      <Link href={`/products/${p.slug}`} onClick={onNavigate} className={link}>
                        <ImageWell media={p.image} alt="" sizes="44px" className="size-11 shrink-0 rounded-sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body font-medium">{p.name}</span>
                          {p.brand && <span className="block truncate text-micro text-ink-soft">{p.brand}</span>}
                        </span>
                        <span className="text-meta tabular-nums">{formatPrice(p.priceFrom)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div className="space-y-5">
              {[{ title: searchCopy.suggestionsCategories, items: data.categories }, { title: layoutCopy.suggestionsCollections, items: data.collections }]
                .filter((g) => g.items.length)
                .map((g) => (
                  <section key={g.title}>
                    <h2 className="t-overline mb-2 text-ink-soft">{g.title}</h2>
                    <ul>{g.items.map((c) => <li key={c.id}><Link href={`/collections/${c.slug}`} onClick={onNavigate} className={link}>{c.name}</Link></li>)}</ul>
                  </section>
                ))}
            </div>
            <Link href={`/search?q=${encodeURIComponent(term)}`} onClick={onNavigate} className="text-body font-medium text-accent-deep underline underline-offset-4 sm:col-span-2">
              {layoutCopy.viewAllResults(term)}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
