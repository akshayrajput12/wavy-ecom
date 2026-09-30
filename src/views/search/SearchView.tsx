import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { FilterPanel, FilterToolbar, ProductGrid, ProductRail } from "@/components/commerce";
import { filterCopy, searchCopy } from "@/data/content";
import { EmptyState } from "@/components/ui/States";
import type { Facets, ProductFilters } from "@/backend/catalog/repo";
import type { Category, Product } from "@/types/domain";
import { RecordSearch, SearchSuggestions } from "./components/SearchSuggestions";

export interface SearchViewProps {
  q: string;
  results: Product[];
  total: number; // matches before filters
  facets: Facets;
  selected: ProductFilters;
  params: Record<string, string>;
  recommendations: Product[];
  departments: Category[];
}

/** Screens 06/07/25 — native GET form, so search works before hydration. */
export function SearchView({ q, results, total, facets, selected, params, recommendations, departments }: SearchViewProps) {
  const hasQuery = q.length > 0;
  return (
    <div className="container-x pb-24">
      <section className="border-b border-line py-10 lg:py-16">
        <h1 className="sr-only">{searchCopy.title}</h1>
        <form action="/search" role="search" className="flex items-center gap-3 border-b-2 border-ink pb-3">
          <Search className="size-7 shrink-0 text-ink-soft" strokeWidth={1.4} aria-hidden />
          <label htmlFor="q" className="sr-only">{searchCopy.label}</label>
          <input
            id="q" name="q" type="search" defaultValue={q} placeholder={searchCopy.placeholder} autoComplete="off" autoFocus={!hasQuery}
            className="min-w-0 flex-1 bg-transparent font-serif text-display leading-none placeholder:text-ink-muted focus:outline-none"
          />
          <button type="submit" className="h-11 rounded-pill bg-ink px-5 text-body font-medium text-on-dark hover:bg-black">{searchCopy.submit}</button>
        </form>
        <div className="mt-8">
          {hasQuery && total > 0 ? (
            <p className="t-h3" aria-live="polite">{searchCopy.resultsFor(q, total)}</p>
          ) : (
            <>
              {!hasQuery && <p className="t-h2 mb-6">{searchCopy.idleTitle}</p>}
              <SearchSuggestions />
            </>
          )}
          <RecordSearch q={q} />
        </div>
      </section>

      {hasQuery && total > 0 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <aside className="hidden lg:col-span-3 lg:block" aria-label="Filters">
            <div className="sticky top-[calc(var(--header-h)+1.5rem)]"><FilterPanel facets={facets} selected={selected} params={params} /></div>
          </aside>
          <div className="lg:col-span-9">
            <FilterToolbar count={results.length} facets={facets} selected={selected} params={params} />
            {results.length ? (
              <ProductGrid products={results} cols={3} className="mt-8" />
            ) : (
              <div className="mt-8"><EmptyState title={filterCopy.empty.title} body={filterCopy.empty.body} /></div>
            )}
          </div>
        </div>
      )}

      {hasQuery && total === 0 && (
        <section className="py-12 text-center" role="status">
          <h2 className="t-display">{searchCopy.emptyTitle(q)}</h2>
          <p className="mx-auto mt-3 max-w-md text-body-lg text-ink-soft">{searchCopy.emptyBody}</p>
          <h3 className="t-overline mt-12 text-ink-soft">{searchCopy.shortcutsTitle}</h3>
          <ul className="mx-auto mt-4 grid max-w-2xl grid-cols-2 gap-4">
            {departments.map((d) => (
              <li key={d.id}>
                <Link href={`/collections/${d.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-md">
                  {d.image && <Image src={d.image.url} alt="" fill sizes="(min-width: 640px) 320px, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />}
                  <span className="absolute inset-0 grid place-items-center bg-black/30 font-serif text-h1 text-on-dark">{d.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ButtonLink href="/new-in" className="mt-10">{searchCopy.newInCta}</ButtonLink>
        </section>
      )}

      {hasQuery && recommendations.length > 0 && (
        <section className="mt-20 overflow-hidden border-t border-line pt-12">
          <h2 className="t-h1 mb-8">{searchCopy.recommendationsTitle}</h2>
          <ProductRail products={recommendations} />
        </section>
      )}
    </div>
  );
}
