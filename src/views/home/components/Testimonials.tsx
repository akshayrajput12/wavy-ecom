import { ImageWell } from "@/components/commerce/ImageWell";
import { RatingStars } from "@/components/commerce/RatingStars";
import { Reveal } from "@/components/ui/Reveal";
import { homeCopy } from "@/data/storefront";
import type { HomeSectionOf, Media, Testimonial } from "@/types/domain";
import { HeadingLines } from "./HeadingLines";
import { Mosaic } from "./Mosaic";

const MIN_TILES = 6;
const MAX_TILES = 12;
const initials = (name: string) => name.split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

function Quote({ t }: { t: Testimonial }) {
  return (
    <figure className="flex h-full flex-col gap-4 border-t border-line pt-6">
      <figcaption className="flex items-center gap-3">
        {t.avatar?.url
          ? <ImageWell media={t.avatar} alt="" sizes="40px" className="size-10 shrink-0 rounded-pill" />
          : <span aria-hidden className="t-index grid size-10 shrink-0 place-items-center rounded-pill bg-ink text-canvas">{initials(t.author)}</span>}
        <span className="min-w-0">
          <span className="block truncate text-body font-medium">{t.author}</span>
          {t.role && <span className="block truncate text-meta text-ink-soft">{t.role}</span>}
        </span>
      </figcaption>
      {t.rating ? <RatingStars rating={t.rating} /> : null}
      <blockquote className="text-body-lg text-pretty">“{t.quote}”</blockquote>
    </figure>
  );
}

/**
 * "Trusted by teams / on and off the pitch": photo mosaic (testimonial avatars, topped up with storefront imagery
 * passed in by HomeView; skipped when there are too few), centred chip + heading, then quotes
 * (3 columns desktop, horizontal scroll on mobile).
 */
export function Testimonials({ section, images = [] }: { section: HomeSectionOf<"testimonials">; images?: Media[] }) {
  const pool = [...section.testimonials.flatMap((t) => (t.avatar?.url ? [t.avatar] : [])), ...images];
  const tiles = [...new Map(pool.map((m) => [m.url, m])).values()].slice(0, MAX_TILES);
  return (
    <section className="section-y overflow-x-clip">
      <div className="container-x">
        {tiles.length >= MIN_TILES && <Mosaic images={tiles} />}
        <div className="flex flex-col items-center text-center">
          <p className="rounded-pill border border-line px-3.5 py-1 text-meta text-ink-soft">{homeCopy.testimonialsChip}</p>
          {section.title && <HeadingLines line={section.title} soft={section.subtitle} className="mt-5 max-w-3xl" />}
        </div>
        <ul
          tabIndex={0}
          aria-label={homeCopy.quotes}
          className="relative -mx-(--gutter) mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-(--gutter) scroll-px-(--gutter) [scrollbar-width:none] focus-visible:outline-offset-4 md:mx-0 md:mt-16 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-12 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {section.testimonials.map((t, i) => (
            <Reveal as="li" key={t.id} delay={Math.min(i, 5) * 0.06} className="w-[82%] shrink-0 snap-start md:w-auto"><Quote t={t} /></Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
