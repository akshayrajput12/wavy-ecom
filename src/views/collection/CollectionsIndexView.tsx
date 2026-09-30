import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { Reveal } from "@/components/ui/Reveal";
import { collectionsIndex } from "@/data/content";
import type { Category, Collection } from "@/types/domain";

export function CollectionsIndexView({ items }: { items: (Collection | Category)[] }) {
  return (
    <div className="container-x pb-24">
      <header className="border-b border-line py-10 lg:py-16">
        <h1 className="t-hero">{collectionsIndex.title}</h1>
        <p className="mt-4 max-w-xl text-body-lg text-ink-soft">{collectionsIndex.description}</p>
      </header>
      <ul className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c, i) => (
          <Reveal as="li" key={c.id} delay={(i % 3) * 0.08} className={clsx(i % 3 === 1 && "lg:mt-16")}>
            <Link href={`/collections/${c.slug}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-surface-warm">
                {c.image && <Image src={c.image.url} alt={c.image.alt} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />}
              </div>
              <h2 className="t-display mt-4 group-hover:underline group-hover:underline-offset-4">{c.name}</h2>
              {c.description && <p className="mt-2 max-w-sm text-body text-ink-soft">{c.description}</p>}
            </Link>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
