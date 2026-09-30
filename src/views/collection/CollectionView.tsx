import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { PackageOpen } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { FilterPanel, FilterToolbar, Pagination, ProductGrid } from "@/components/commerce";
import { filterCopy, productCopy } from "@/data/copy";
import { collectionCopy } from "@/data/storefront";
import type { ProductList } from "@/backend/catalog/repo";
import type { CategoryRef, Media } from "@/types/domain";

export interface CollectionViewProps {
  title: string; description?: string; banner?: Media; trail: CategoryRef[]; subcategories: CategoryRef[];
  isCategory: boolean; list: ProductList; path: string; params: Record<string, string | string[] | undefined>;
}

/** Category or collection listing: banner, subcategory chips, URL-synced facet filters, pagination. */
export function CollectionView({ title, description, banner, trail, subcategories, isCategory, list, path, params }: CollectionViewProps) {
  const refined = Object.keys(params).some((k) => ["opt", "brand", "min", "max", "inStock", "category"].includes(k));
  const filterProps = { facets: list.facets, hideCategories: isCategory };
  return (
    <div className="pb-24">
      <header className={clsx("relative", banner && "overflow-hidden bg-black text-on-dark")}>
        {banner && <Image src={banner.url} alt={banner.alt} fill preload sizes="100vw" className="object-cover opacity-70" />}
        <div className={clsx("container-x relative py-10 lg:py-16", banner && "bg-linear-to-t from-black/50 to-transparent")}>
          <nav aria-label="Breadcrumb" className={clsx("text-meta", banner ? "text-on-dark/80" : "text-ink-soft")}>
            <ol className="flex flex-wrap gap-1.5">
              <li><Link href="/" className="hover:underline">{productCopy.breadcrumbHome}</Link> <span aria-hidden>/</span></li>
              {trail.map((t) => <li key={t.id}><Link href={`/collections/${t.slug}`} className="hover:underline">{t.name}</Link> <span aria-hidden>/</span></li>)}
              <li aria-current="page">{title}</li>
            </ol>
          </nav>
          <h1 className="t-hero mt-4">{title}</h1>
          {description && <p className={clsx("mt-4 max-w-xl text-body-lg", banner ? "text-on-dark/85" : "text-ink-soft")}>{description}</p>}
        </div>
      </header>

      <div className="container-x">
        {subcategories.length > 0 && (
          <nav aria-label={collectionCopy.subcategories} className="-mx-(--gutter) overflow-x-auto px-(--gutter) py-6 [scrollbar-width:none]">
            <ul className="flex gap-2">
              {subcategories.map((s) => (
                <li key={s.id} className="shrink-0">
                  <Link href={`/collections/${s.slug}`} className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-meta font-medium transition-colors duration-(--dur-fast) hover:border-ink">{s.name}</Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mt-6 grid gap-8 lg:grid-cols-12 lg:gap-10">
          <aside className="hidden lg:col-span-3 lg:block" aria-label={filterCopy.title}>
            <div className="sticky top-[calc(var(--header-h)+1.5rem)] max-h-[calc(100dvh-var(--header-h)-3rem)] overflow-y-auto pr-2" data-lenis-prevent>
              <FilterPanel {...filterProps} />
            </div>
          </aside>
          <div className="lg:col-span-9">
            <FilterToolbar total={list.total} {...filterProps} />
            <div className="mt-8">
              {list.items.length ? (
                <ProductGrid products={list.items} cols={3} />
              ) : refined ? (
                <EmptyState title={filterCopy.empty.title} body={filterCopy.empty.body} />
              ) : (
                <EmptyState icon={<PackageOpen className="size-7" aria-hidden />} title={collectionCopy.emptyScope.title} body={collectionCopy.emptyScope.body}
                  action={<ButtonLink href="/collections" variant="secondary">{collectionCopy.browse}</ButtonLink>} />
              )}
            </div>
            <Pagination page={list.page} total={list.total} pageSize={list.pageSize} path={path} params={params} />
          </div>
        </div>
      </div>
    </div>
  );
}
