import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ImageWell } from "@/components/commerce/ImageWell";
import { Carousel } from "@/components/ui/Carousel";
import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { SectionHead } from "./SectionHead";

/** Collection cards: each opens /collections/<slug>, where shoppers filter within the collection. */
export function CollectionRail({ section }: { section: HomeSectionOf<"collection_rail"> }) {
  return (
    <section className="container-x section-y">
      <SectionHead title={section.title} subtitle={section.subtitle} />
      <Carousel label={section.title ?? homeCopy.slideshow} perView={{ base: 1.3, sm: 2.2, lg: 3 }} bleed>
        {section.collections.map((c) => (
          <Link key={c.id} href={`/collections/${c.slug}`} className="group relative block overflow-hidden rounded-xl">
            <ImageWell media={c.image} alt={c.image?.alt ?? ""} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 45vw, 80vw" className="aspect-[4/5]"
              imgClassName="transition-[scale] duration-(--dur-slow) ease-soft group-hover:scale-[1.04]" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-linear-to-t from-black/60 to-transparent p-5 pt-20 text-on-dark">
              <div>
                <h3 className="t-h2">{c.name}</h3>
                {c.productCount ? <p className="text-meta text-on-dark/80">{homeCopy.products(c.productCount)}</p> : null}
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-pill bg-on-dark text-ink transition-transform duration-(--dur-base) ease-soft group-hover:rotate-45" aria-hidden>
                <ArrowUpRight className="size-5" />
              </span>
            </div>
          </Link>
        ))}
      </Carousel>
    </section>
  );
}
