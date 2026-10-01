import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { ImageWell } from "@/components/commerce/ImageWell";
import { EmptyState } from "@/components/ui/States";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import { collectionsIndexCopy } from "@/data/copy";
import { collectionCopy, homeCopy } from "@/data/storefront";
import type { Category, Collection } from "@/types/domain";

type Tile = { id: string; name: string; slug: string; image?: Category["image"]; meta?: string };

function Tiles({ title, items }: { title: string; items: Tile[] }) {
  return (
    <section className="mt-12">
      <h2 className="t-h1">{title}</h2>
      <Stagger as="ul" className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((c) => (
          <StaggerItem as="li" key={c.id}>
            <Link href={`/collections/${c.slug}`} className="group block rounded-lg">
              <ImageWell media={c.image} alt={c.image?.alt ?? ""} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" className="aspect-[4/5] rounded-lg"
                imgClassName="transition-[scale] duration-700 ease-out group-hover:scale-[1.06]" />
              <p className="mt-3 text-body font-medium decoration-line underline-offset-4 group-hover:underline">{c.name}</p>
              {c.meta && <p className="text-meta text-ink-soft">{c.meta}</p>}
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

export function CollectionsIndexView({ categories, collections }: { categories: Category[]; collections: Collection[] }) {
  return (
    <div className="container-x pb-24">
      <header className="border-b border-line pb-10 pt-8 lg:pb-14 lg:pt-12">
        <h1 className="t-display">{collectionsIndexCopy.title}</h1>
      </header>
      {!categories.length && !collections.length && (
        <div className="mt-10"><EmptyState icon={<LayoutGrid className="size-7" aria-hidden />} title={collectionsIndexCopy.empty} /></div>
      )}
      {collections.length > 0 && (
        <Tiles title={collectionCopy.collections} items={collections.map((c) => ({ ...c, meta: c.productCount ? homeCopy.products(c.productCount) : undefined }))} />
      )}
      {categories.length > 0 && <Tiles title={collectionCopy.categories} items={categories} />}
    </div>
  );
}
