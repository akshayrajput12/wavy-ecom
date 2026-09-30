import Image from "next/image";
import { clsx } from "clsx";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ArticleCard, ProductCard } from "@/components/commerce";
import { editorial as e } from "@/data/home";
import type { BlogPost, Product } from "@/types/domain";

const INDENTS = ["", "pl-[12vw]", "pl-[4vw]", "pl-[22vw]"];

/** Screen 02 — the magazine-style home: same tokens and cards, looser asymmetric grid. */
export function EditorialView({ picks, posts }: { picks: Product[]; posts: BlogPost[] }) {
  const [p1, p2, p3] = e.plates;
  return (
    <>
      <section className="relative -mt-[var(--header-h)] overflow-hidden bg-black pb-16 pt-[calc(var(--header-h)+3rem)] text-on-dark lg:pb-24">
        <div className="container-x">
          <div className="flex justify-between border-b border-on-dark/20 pb-4 text-micro uppercase tracking-[0.2em] text-on-dark/60">
            <span>{e.issue}</span><span>{e.season}</span>
          </div>
          <div className="relative mt-10 lg:mt-16">
            <h1 className="relative z-10 font-serif text-[clamp(4rem,14vw,13rem)] leading-[0.86] tracking-[-0.03em]">
              {e.title.map((line, i) => (
                <Reveal key={line} delay={i * 0.08} y={40}><span className={clsx("block", INDENTS[i], i % 2 === 1 && "italic")}>{line}</span></Reveal>
              ))}
            </h1>
            <Reveal delay={0.3} className="relative mt-10 aspect-[3/4] w-3/4 overflow-hidden rounded-sm sm:absolute sm:right-0 sm:top-1/2 sm:mt-0 sm:w-[34%] sm:-translate-y-1/2">
              <Image src={p1.image.url} alt={p1.image.alt} fill priority sizes="(min-width: 640px) 34vw, 75vw" className="object-cover" />
            </Reveal>
          </div>
          <div className="mt-12 grid gap-8 lg:mt-20 lg:grid-cols-12">
            <p className="font-serif text-h2 leading-snug text-on-dark/90 lg:col-span-5">{e.intro}</p>
            <div className="lg:col-span-3 lg:col-start-10 lg:self-end">
              <ButtonLink href={e.cta.href} variant="accent" size="lg">{e.cta.label}</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x section-y grid grid-cols-12 gap-4 sm:gap-5">
        {[
          { plate: p2, cls: "col-span-12 sm:col-span-7 aspect-[4/5]" },
          { plate: p3, cls: "col-span-8 col-start-5 sm:col-span-4 sm:col-start-9 sm:mt-40 aspect-[3/4]" },
        ].map(({ plate, cls }, i) => (
          <Reveal key={plate.caption} delay={i * 0.12} className={cls}>
            <figure className="h-full">
              <div className="relative h-full overflow-hidden rounded-sm bg-surface-warm">
                <Image src={plate.image.url} alt={plate.image.alt} fill sizes="(min-width: 640px) 55vw, 100vw" className="object-cover" />
              </div>
              <figcaption className="mt-3 text-micro uppercase tracking-[0.16em] text-ink-soft">{plate.caption}</figcaption>
            </figure>
          </Reveal>
        ))}
      </section>

      <section className="section-y bg-surface-warm">
        <Reveal className="container-x mx-auto max-w-5xl text-center">
          <p className="t-overline text-ink-soft">{e.manifesto.overline}</p>
          <blockquote className="t-hero mx-auto mt-6 max-w-[18ch] text-balance italic">“{e.manifesto.quote}”</blockquote>
          <p className="mx-auto mt-8 max-w-xl text-body-lg text-ink-soft">{e.manifesto.body}</p>
        </Reveal>
      </section>

      <section className="container-x section-y space-y-20 lg:space-y-32">
        {e.chapters.map((c, i) => (
          <div key={c.n} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-5">
            <Reveal className={clsx("relative aspect-[5/4] overflow-hidden rounded-sm lg:col-span-7", i % 2 === 1 && "lg:order-2 lg:col-start-6")}>
              <Image src={c.image.url} alt={c.image.alt} fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
            </Reveal>
            <Reveal delay={0.1} className={clsx("lg:col-span-4", i % 2 === 0 ? "lg:col-start-9" : "lg:order-1 lg:col-start-1")}>
              <p className="font-serif text-[6rem] leading-none text-accent-deep">{c.n}</p>
              <h2 className="t-display mt-2">{c.title}</h2>
              <p className="mt-4 text-body-lg text-ink-soft">{c.body}</p>
            </Reveal>
          </div>
        ))}
      </section>

      <section className="container-x section-y border-t border-line">
        <h2 className="t-display mb-12 max-w-md">{e.picksTitle}</h2>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-12 sm:gap-x-5 lg:grid-cols-3">
          {picks.map((p, i) => (
            <Reveal as="li" key={p.id} delay={(i % 3) * 0.08} className={clsx(i % 3 === 1 && "lg:mt-24", i % 3 === 2 && "lg:mt-12")}>
              <ProductCard product={p} sizes="(min-width: 1024px) 33vw, 50vw" />
            </Reveal>
          ))}
        </ul>
      </section>

      {posts.length > 0 && (
        <section className="container-x section-y grid gap-10 border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => <ArticleCard key={p.id} post={p} />)}
        </section>
      )}
    </>
  );
}
