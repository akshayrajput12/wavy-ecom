import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { clsx } from "clsx";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { ArticleCard, ProductCard, ProductRail } from "@/components/commerce";
import { home } from "@/data/home";
import type { CollectionPage } from "@/backend/catalog/repo";
import type { BlogPost, Product, Testimonial } from "@/types/domain";

export function SectionHead({ overline, title, cta }: { overline: string; title: string; cta?: { label: string; href: string } }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-6 lg:mb-12">
      <div>
        <p className="t-overline text-ink-soft">{overline}</p>
        <h2 className="t-display mt-3 text-balance">{title}</h2>
      </div>
      {cta && (
        <Link href={cta.href} className="group inline-flex shrink-0 items-center gap-2 pb-2 text-body font-medium">
          {cta.label} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function Departments() {
  return (
    <section className="container-x section-y grid gap-4 sm:grid-cols-12 sm:gap-5">
      {home.departments.map((d, i) => (
        <Reveal key={d.href} delay={i * 0.1} className={clsx(i === 0 ? "sm:col-span-7" : "sm:col-span-5 sm:mt-24")}>
          <Link href={d.href} className="group relative block overflow-hidden rounded-md bg-surface-warm">
            <div className={clsx("relative", i === 0 ? "aspect-[4/5] sm:aspect-[7/8]" : "aspect-[4/5]")}>
              <Image src={d.image.url} alt={d.image.alt} fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover transition duration-1000 ease-out group-hover:scale-[1.04]" />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-linear-to-t from-black/60 to-transparent p-5 pt-24 text-on-dark sm:p-8">
              <div>
                <h2 className="t-display">{d.label}</h2>
                <p className="mt-1 text-body text-on-dark/80">{d.body}</p>
              </div>
              <span className="grid size-12 place-items-center rounded-pill bg-on-dark text-ink transition-transform duration-300 group-hover:rotate-45">
                <ArrowUpRight className="size-5" aria-hidden />
              </span>
            </div>
          </Link>
        </Reveal>
      ))}
    </section>
  );
}

export function NewArrivals({ products }: { products: Product[] }) {
  return (
    <section className="container-x section-y overflow-hidden">
      <SectionHead {...home.newArrivals} />
      <ProductRail products={products} />
    </section>
  );
}

export function FeaturedCollection({ collection, products }: { collection: CollectionPage; products: Product[] }) {
  const f = home.featured;
  return (
    <section className="section-y bg-surface-warm">
      <div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-5">
        {collection.image && (
          <Reveal className="relative aspect-[4/5] overflow-hidden rounded-md lg:col-span-6 lg:aspect-auto lg:min-h-[720px]">
            <Image src={collection.image.url} alt={collection.image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </Reveal>
        )}
        <div className="flex flex-col justify-between gap-10 lg:col-span-5 lg:col-start-8">
          <Reveal>
            <p className="t-overline text-ink-soft">{f.overline}</p>
            <h2 className="t-hero mt-4">{collection.title}</h2>
            <p className="mt-5 max-w-md text-body-lg text-ink-soft">{collection.description}</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {f.notes.map((n) => <li key={n} className="rounded-pill border border-ink/20 px-3 py-1 text-meta">{n}</li>)}
            </ul>
            <ButtonLink href={`/collections/${collection.slug}`} className="mt-8">{f.cta}</ButtonLink>
          </Reveal>
          <div className="grid grid-cols-2 gap-4">
            {products.slice(0, 2).map((p, i) => (
              <Reveal key={p.id} delay={i * 0.1} className={clsx(i === 1 && "mt-12")}>
                <ProductCard product={p} sizes="(min-width: 1024px) 20vw, 50vw" />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BundleBanner() {
  const b = home.bundle;
  return (
    <section className="container-x section-y">
      <Reveal className="grid overflow-hidden rounded-lg bg-accent text-ink md:grid-cols-2">
        <div className="flex flex-col justify-center gap-5 p-8 sm:p-12 lg:p-16">
          <p className="t-overline">{b.overline}</p>
          <h2 className="t-hero max-w-[10ch]">{b.title}</h2>
          <p className="max-w-sm text-body-lg">{b.body}</p>
          <ButtonLink href={b.cta.href} size="lg" className="self-start">{b.cta.label}</ButtonLink>
        </div>
        <div className="relative min-h-72">
          <Image src={b.image.url} alt={b.image.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
      </Reveal>
    </section>
  );
}

export function SocialProof({ testimonials }: { testimonials: Testimonial[] }) {
  const s = home.social;
  return (
    <section className="container-x section-y">
      <SectionHead overline={s.overline} title={s.title} />
      <ul className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t, i) => (
          <Reveal as="li" key={t.id} delay={i * 0.1} className={clsx("flex flex-col justify-between gap-8 rounded-md border border-line bg-surface p-7", i === 1 && "md:translate-y-10")}>
            <blockquote className="font-serif text-h2 leading-snug">“{t.quote}”</blockquote>
            <p className="text-meta"><span className="font-semibold text-ink">{t.author}</span><span className="text-ink-soft"> — {t.role}</span></p>
          </Reveal>
        ))}
      </ul>
      <dl className="mt-20 grid grid-cols-3 gap-4 border-t border-line pt-8">
        {s.stats.map((st) => (
          <div key={st.label}>
            <dt className="t-meta">{st.label}</dt>
            <dd className="mt-1 font-serif text-display leading-none">{st.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function JournalTeaser({ posts }: { posts: BlogPost[] }) {
  const [lead, ...rest] = posts;
  if (!lead) return null;
  return (
    <section className="container-x section-y border-t border-line">
      <SectionHead {...home.journal} />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-5">
        <Reveal className="lg:col-span-7"><ArticleCard post={lead} large /></Reveal>
        <div className="grid gap-10 sm:grid-cols-2 lg:col-span-4 lg:col-start-9 lg:grid-cols-1">
          {rest.slice(0, 2).map((p, i) => <Reveal key={p.id} delay={0.1 + i * 0.1}><ArticleCard post={p} /></Reveal>)}
        </div>
      </div>
    </section>
  );
}
