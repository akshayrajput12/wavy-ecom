import Image from "next/image";
import Link from "next/link";
import { ChevronRight, PackageOpen } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { FilterToolbar, Pagination, ProductGrid } from "@/components/commerce";
import { filterCopy, productCopy } from "@/data/copy";
import { collectionCopy } from "@/data/storefront";
import type { ProductList } from "@/backend/catalog/repo";
import type { CategoryRef, Media } from "@/types/domain";
import { SubcategoryStrip, type SubcategoryStripProps } from "./components/SubcategoryStrip";

export interface CollectionViewProps {
  title: string; description?: string; banner?: Media; trail: CategoryRef[]; strip?: SubcategoryStripProps;
  isCategory: boolean; list: ProductList; path: string; params: Record<string, string | string[] | undefined>;
}

function Crumbs({ trail, title }: { trail: CategoryRef[]; title: string }) {
  const sep = <ChevronRight className="size-3" aria-hidden />;
  return (
    <nav aria-label="Breadcrumb" className="t-meta">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li className="flex items-center gap-1.5"><Link href="/" className="hover:text-ink">{productCopy.breadcrumbHome}</Link>{sep}</li>
        {trail.map((t) => <li key={t.id} className="flex items-center gap-1.5"><Link href={`/collections/${t.slug}`} className="hover:text-ink">{t.name}</Link>{sep}</li>)}
        <li aria-current="page" className="text-ink">{title}</li>
      </ol>
    </nav>
  );
}

/** Category or collection listing: dark banner (or plain heading), sub-category / sibling strip, filter/sort toolbar, 2/3/4 grid, pagination. */
export function CollectionView({ title, description, banner, trail, strip, isCategory, list, path, params }: CollectionViewProps) {
  const refined = Object.keys(params).some((k) => ["opt", "brand", "min", "max", "inStock", "category"].includes(k));
  const filterProps = { facets: list.facets, hideCategories: isCategory };
  const count = <p className="t-index text-ink-soft">{filterCopy.results(list.total)}</p>;

  return (
    <div className="pb-24">
      <header className="container-x pt-4">
        {banner ? (
          <div className="on-dark relative isolate overflow-hidden rounded-xl">
            <Image src={banner.url} alt={banner.alt} fill preload sizes="(min-width: 1440px) 1392px, 100vw" className="-z-10 object-cover opacity-70" />
            <div className="absolute inset-0 -z-10 bg-linear-to-t from-black via-black/40 to-transparent" aria-hidden />
            <div className="flex min-h-80 flex-col justify-end gap-4 p-6 sm:p-10 lg:min-h-112 lg:p-14">
              <Crumbs trail={trail} title={title} />
              <h1 className="t-hero max-w-4xl">{title}</h1>
              <div className="flex flex-wrap items-end justify-between gap-4">
                {description && <p className="max-w-xl text-body-lg text-ink-soft">{description}</p>}
                {count}
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-4 lg:pt-8">
            <Crumbs trail={trail} title={title} />
            <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="t-display max-w-4xl">{title}</h1>
                {description && <p className="mt-4 max-w-xl text-body-lg text-ink-soft">{description}</p>}
              </div>
              {count}
            </div>
          </div>
        )}
      </header>

      <div className="container-x">
        {strip && <SubcategoryStrip {...strip} />}

        <div className="mt-8">
          <FilterToolbar total={list.total} {...filterProps} />
          <div className="mt-8">
            {list.items.length ? (
              <ProductGrid products={list.items} />
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
  );
}
