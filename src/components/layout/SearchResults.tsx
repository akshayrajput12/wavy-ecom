import Link from "next/link";
import { clsx } from "clsx";
import { ArrowUpRight, Clock, Search } from "lucide-react";
import { ImageWell } from "@/components/commerce/ImageWell";
import { searchCopy } from "@/data/copy";
import { layoutCopy } from "@/data/storefront";
import { formatPrice } from "@/lib/format";
import type { SearchSuggestions } from "@/backend/catalog/repo";

type Product = SearchSuggestions["products"][number];
export interface SuggestOption { key: string; href: string; label: string; product?: Product; recent?: boolean; all?: boolean }
export interface SuggestGroup { key: string; title: string; items: SuggestOption[] }

/** Groups in render order; the flattened items are the keyboard order (↑/↓). */
export function suggestionGroups(term: string, data: SearchSuggestions | null, recent: string[]): SuggestGroup[] {
  const search = (q: string) => `/search?q=${encodeURIComponent(q)}`;
  if (!term) return [{ key: "recent", title: searchCopy.recentTitle, items: recent.map((r) => ({ key: `r-${r}`, href: search(r), label: r, recent: true })) }];
  if (!data) return [];
  const links = (k: string, list: { id: string; name: string; slug: string }[]) => list.map((c) => ({ key: `${k}-${c.id}`, href: `/collections/${c.slug}`, label: c.name }));
  return [
    { key: "products", title: searchCopy.suggestionsProducts, items: data.products.map((p) => ({ key: `p-${p.id}`, href: `/products/${p.slug}`, label: p.name, product: p })) },
    { key: "categories", title: searchCopy.suggestionsCategories, items: links("c", data.categories) },
    { key: "collections", title: layoutCopy.suggestionsCollections, items: links("k", data.collections) },
    { key: "all", title: "", items: [{ key: "all", href: search(term), label: layoutCopy.viewAllResults(term), all: true }] },
  ].filter((g) => g.items.length);
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Bolds each typed word inside `text` (case-insensitive). */
export function Highlight({ text, term }: { text: string; term: string }) {
  const words = term.split(" ").filter(Boolean).map(escape);
  if (!words.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${words.join("|")})`, "gi"));
  return <>{parts.map((p, i) => (i % 2 ? <mark key={i} className="bg-transparent font-semibold text-ink">{p}</mark> : p))}</>;
}

const row = "flex min-h-11 items-center gap-3 rounded-sm px-2 py-1 text-ink transition-colors duration-(--dur-fast) hover:bg-surface-warm aria-selected:bg-surface-warm";

function OptionLink({ o, id, selected, term, onChoose }: { o: SuggestOption; id: string; selected: boolean; term: string; onChoose: (o: SuggestOption) => void }) {
  const p = o.product;
  return (
    <Link href={o.href} id={id} role="option" aria-selected={selected} tabIndex={-1} onClick={() => onChoose(o)}
      className={clsx(row, o.all && "mt-1 border-t border-line-soft pt-2 font-medium")}>
      {p ? <span aria-hidden className="shrink-0"><ImageWell media={p.image} alt="" sizes="44px" className="size-11 rounded-sm" /></span>
        : <span className="grid size-8 shrink-0 place-items-center text-ink-soft" aria-hidden>
          {o.recent ? <Clock className="size-4" /> : o.all ? <Search className="size-4" /> : <ArrowUpRight className="size-4" />}
        </span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body">{o.all || o.recent ? o.label : <Highlight text={o.label} term={term} />}</span>
        {p && (p.category || p.brand) && <span className="block truncate text-micro text-ink-soft">{[p.category, p.brand].filter(Boolean).join(" · ")}</span>}
      </span>
      {p && <span className="shrink-0 text-meta tabular-nums">{formatPrice(p.priceFrom)}</span>}
    </Link>
  );
}

/** The combobox popup: grouped options (role="listbox"), driven by SearchBox. */
export function SearchResults({ id, groups, active, optionId, term, busy, onChoose }: {
  id: string; groups: SuggestGroup[]; active: number; optionId: (i: number) => string; term: string; busy: boolean;
  onChoose: (o: SuggestOption) => void;
}) {
  const index = new Map(groups.flatMap((g) => g.items).map((o, n) => [o.key, n]));
  const render = (g: SuggestGroup) => (
    <div key={g.key} role="group" aria-label={g.title || undefined} className={clsx(g.key === "all" && "sm:col-span-2")}>
      {g.title && g.key !== "recent" && <p aria-hidden className="t-overline mb-1 px-2 text-ink-soft">{g.title}</p>}
      {g.items.map((o) => {
        const n = index.get(o.key) ?? -1;
        return <OptionLink key={o.key} o={o} id={optionId(n)} selected={n === active} term={term} onChoose={onChoose} />;
      })}
    </div>
  );
  const side = groups.filter((g) => g.key === "categories" || g.key === "collections");
  return (
    <div id={id} role="listbox" aria-label={layoutCopy.suggestionsLabel} aria-busy={busy}
      className={clsx("grid gap-x-6 gap-y-4 transition-opacity duration-(--dur-fast)", busy && "opacity-60", side.length && "sm:grid-cols-[2fr_1fr]")}>
      {groups.filter((g) => !side.includes(g) && g.key !== "all").map(render)}
      {side.length > 0 && <div className="space-y-4">{side.map(render)}</div>}
      {groups.filter((g) => g.key === "all").map(render)}
    </div>
  );
}
