import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { FilterPanel, FilterToolbar, PriceTag, ProductGrid } from "@/components/commerce";
import { filterCopy, productCopy, searchCopy } from "@/data/content";
import type { CollectionPage, Facets, ProductFilters } from "@/backend/catalog/repo";
import type { Product } from "@/types/domain";

export interface CollectionViewProps {
  page: CollectionPage;
  products: Product[];
  facets: Facets;
  selected: ProductFilters;
  params: Record<string, string>;
  latest?: Product;
}

/** Screens 03/04/05/22 — collection with URL-driven filters. */
export function CollectionView({ page, products, facets, selected, params, latest }: CollectionViewProps) {
  const filterProps = { facets, selected, params, isFootwear: page.isFootwear };
  return (
    <div className="container-x pb-24">
      <header className="grid gap-6 border-b border-line py-10 lg:grid-cols-12 lg:py-16">
        <div className="lg:col-span-7">
          <nav aria-label="Breadcrumb" className="t-meta">
            <Link href="/" className="hover:text-ink">{productCopy.breadcrumbHome}</Link> <span aria-hidden>/</span> <span aria-current="page">{page.title}</span>
          </nav>
          <h1 className="t-hero mt-4">{page.title}</h1>
          {page.description && <p className="mt-4 max-w-xl text-body-lg text-ink-soft">{page.description}</p>}
        </div>
        {latest && (
          <Link href={`/products/${latest.slug}`} className="group flex items-center gap-4 self-end rounded-md border border-line bg-surface p-3 lg:col-span-4 lg:col-start-9">
            <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-surface-warm">
              <Image src={latest.images[0].url} alt="" fill sizes="80px" className="object-cover transition duration-500 group-hover:scale-105" />
            </span>
            <span className="min-w-0">
              <Badge tone="dark">{filterCopy.latestDrop}</Badge>
              <span className="mt-2 block truncate text-body font-medium">{latest.name}</span>
              <PriceTag price={latest.priceFrom} compareAt={latest.compareAtFrom} className="text-meta" />
            </span>
          </Link>
        )}
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-10">
        <aside className="hidden lg:col-span-3 lg:block" aria-label={filterCopy.title}>
          <div className="sticky top-[calc(var(--header-h)+1.5rem)] max-h-[calc(100dvh-var(--header-h)-3rem)] overflow-y-auto pr-2" data-lenis-prevent>
            <FilterPanel {...filterProps} />
          </div>
        </aside>
        <div className="lg:col-span-9">
          <FilterToolbar count={products.length} {...filterProps} />
          <div className="mt-8">
            {products.length ? (
              <ProductGrid products={products} cols={3} />
            ) : (
              <EmptyState title={filterCopy.empty.title} body={filterCopy.empty.body} action={<ButtonLink href="/new-in" variant="secondary">{searchCopy.newInCta}</ButtonLink>} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
