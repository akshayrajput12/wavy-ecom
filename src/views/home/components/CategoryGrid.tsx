import Link from "next/link";
import { ImageWell } from "@/components/commerce/ImageWell";
import { Stagger, StaggerItem } from "@/components/ui/Reveal";
import type { HomeSectionOf } from "@/types/domain";
import { SectionHead } from "./SectionHead";

/** Category image tiles, each linking to its collection page. */
export function CategoryGrid({ section }: { section: HomeSectionOf<"category_grid"> }) {
  return (
    <section className="container-x section-y">
      <SectionHead title={section.title} subtitle={section.subtitle} />
      <Stagger as="ul" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
        {section.categories.map((c) => (
          <StaggerItem as="li" key={c.id}>
            <Link href={`/collections/${c.slug}`} className="group block rounded-lg">
              <ImageWell media={c.image} alt={c.image?.alt ?? ""} sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 45vw" className="lift aspect-square rounded-lg"
                imgClassName="transition-[scale] duration-(--dur-slow) ease-soft group-hover:scale-[1.04]" />
              <p className="mt-3 text-center text-body font-medium group-hover:text-accent-deep">{c.name}</p>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
