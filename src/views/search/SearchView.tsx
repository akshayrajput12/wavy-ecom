import Link from "next/link";
import { SearchX } from "lucide-react";
import { SearchBox } from "@/components/layout/SearchBox";
import { EmptyState } from "@/components/ui/States";
import { FilterPanel, FilterToolbar, Pagination, ProductGrid } from "@/components/commerce";
import { ImageWell } from "@/components/commerce/ImageWell";
import { filterCopy, searchCopy } from "@/data/copy";
import type { ProductList } from "@/backend/catalog/repo";
import type { Category } from "@/types/domain";
import { RecordSearch, SearchSuggestions } from "./components/SearchSuggestions";

export interface SearchViewProps {
  q: string; list: ProductList | null; categories: Category[]; params: Record<string, string | string[] | undefined>;
}

function Shortcuts({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return (
    <section className="mt-12">
      <h2 className="t-overline text-ink-soft">{searchCopy.shortcutsTitle}</h2>
      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {categories.slice(0, 8).map((c) => (
          <li key={c.id}>
            <Link href={`/collections/${c.slug}`} className="group block">
              <ImageWell media={c.image} alt="" sizes="(min-width: 640px) 25vw, 50vw" className="lift aspect-[4/3] rounded-md"
                imgClassName="transition-[scale] duration-(--dur-slow) group-hover:scale-[1.04]" />
              <p className="mt-2 text-body font-medium">{c.name}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Live suggestions while typing; submitted queries get full results with facets and pagination. */
export function SearchView({ q, list, categories, params }: SearchViewProps) {
  const filtered = Object.keys(params).some((k) => k !== "q" && k !== "page");
  return (
    <div className="container-x pb-24">
      <section className="border-b border-line py-10 lg:py-14">
        <h1 className="sr-only">{searchCopy.title}</h1>
        <SearchBox defaultValue={q} autoFocus={!q} large />
        <RecordSearch q={q} />
        <div className="mt-8">
          {q && list && list.total > 0 ? <p className="t-h3" aria-live="polite">{searchCopy.resultsFor(q, list.total)}</p> : (
            <>
              {!q && <p className="t-h2 mb-6">{searchCopy.idleTitle}</p>}
              <SearchSuggestions />
            </>
          )}
        </div>
      </section>

      {q && list && (list.total > 0 || filtered) ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <aside className="hidden lg:col-span-3 lg:block" aria-label={filterCopy.title}>
            <div className="sticky top-[calc(var(--header-h)+1.5rem)] max-h-[calc(100dvh-var(--header-h)-3rem)] overflow-y-auto pr-2" data-lenis-prevent>
              <FilterPanel facets={list.facets} />
            </div>
          </aside>
          <div className="lg:col-span-9">
            <FilterToolbar total={list.total} facets={list.facets} />
            <div className="mt-8">
              {list.items.length ? <ProductGrid products={list.items} cols={3} /> : <EmptyState title={filterCopy.empty.title} body={filterCopy.empty.body} />}
            </div>
            <Pagination page={list.page} total={list.total} pageSize={list.pageSize} path="/search" params={params} />
          </div>
        </div>
      ) : q ? (
        <div className="mt-10">
          <EmptyState icon={<SearchX className="size-7" aria-hidden />} title={searchCopy.emptyTitle(q)} body={searchCopy.emptyBody} />
          <Shortcuts categories={categories} />
        </div>
      ) : (
        <Shortcuts categories={categories} />
      )}
    </div>
  );
}
