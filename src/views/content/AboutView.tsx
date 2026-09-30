import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { about as a } from "@/data/content";

/** Screen 39 — brand story, values, process. */
export function AboutView() {
  return (
    <>
      <section className="container-x grid gap-10 pb-16 pt-10 lg:grid-cols-12 lg:gap-5 lg:pt-16">
        <div className="lg:col-span-6">
          <p className="t-overline text-ink-soft">{a.overline}</p>
          <h1 className="t-hero mt-4 text-balance">{a.title}</h1>
        </div>
        <p className="self-end font-serif text-h2 leading-snug text-ink-soft lg:col-span-5 lg:col-start-8">{a.intro}</p>
      </section>
      <Reveal className="relative mx-auto aspect-[16/10] max-w-[var(--container)] overflow-hidden sm:aspect-[21/9]">
        <Image src={a.hero.url} alt={a.hero.alt} fill priority sizes="100vw" className="object-cover" />
      </Reveal>

      <section className="container-x section-y">
        <ul className="grid gap-10 md:grid-cols-3 md:gap-5">
          {a.values.map((v, i) => (
            <Reveal as="li" key={v.title} delay={i * 0.1} className="border-t border-ink pt-6">
              <p className="font-serif text-h1 text-accent-deep">0{i + 1}</p>
              <h2 className="t-h2 mt-3">{v.title}</h2>
              <p className="mt-3 text-body-lg text-ink-soft">{v.body}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="section-y bg-surface-warm">
        <div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-5">
          <div className="lg:col-span-5">
            <h2 className="t-display">{a.process.title}</h2>
            <ol className="mt-10 space-y-8">
              {a.process.steps.map((s) => (
                <li key={s.n} className="grid grid-cols-[3.5rem_1fr] gap-4">
                  <span className="font-serif text-h1 leading-none">{s.n}</span>
                  <span><span className="block text-body-lg font-semibold">{s.title}</span><span className="text-body text-ink-soft">{s.body}</span></span>
                </li>
              ))}
            </ol>
            <ButtonLink href={a.cta.href} className="mt-10">{a.cta.label}</ButtonLink>
          </div>
          <Reveal className="relative aspect-[4/5] overflow-hidden rounded-md lg:col-span-6 lg:col-start-7">
            <Image src={a.image.url} alt={a.image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
