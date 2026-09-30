import { ImageWell } from "@/components/commerce/ImageWell";
import { RatingStars } from "@/components/commerce/RatingStars";
import { Carousel } from "@/components/ui/Carousel";
import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf } from "@/types/domain";
import { SectionHead } from "./SectionHead";

export function Testimonials({ section }: { section: HomeSectionOf<"testimonials"> }) {
  return (
    <section className="section-y bg-surface-warm">
      <div className="container-x">
        <SectionHead title={section.title} subtitle={section.subtitle} />
        <Carousel label={section.title ?? homeCopy.slideshow} perView={{ base: 1.1, sm: 2, lg: 3 }} bleed dots>
          {section.testimonials.map((t) => (
            <figure key={t.id} className="flex h-full flex-col justify-between gap-6 rounded-lg border border-line-soft bg-surface p-7">
              <div>
                {t.rating ? <RatingStars rating={t.rating} className="mb-4" /> : null}
                <blockquote className="font-serif text-h2 leading-snug">“{t.quote}”</blockquote>
              </div>
              <figcaption className="flex items-center gap-3 text-meta">
                {t.avatar && <ImageWell media={t.avatar} alt="" sizes="40px" className="size-10 shrink-0 rounded-pill" />}
                <span>
                  <span className="block font-semibold text-ink">{t.author}</span>
                  {t.role && <span className="text-ink-soft">{t.role}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </Carousel>
      </div>
    </section>
  );
}
