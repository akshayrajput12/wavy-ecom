import { Reveal } from "@/components/ui/Reveal";
import type { HomeSectionOf } from "@/types/domain";
import { HeadingLines } from "./HeadingLines";
import { NewsletterPill } from "./NewsletterPill";

/** Calm warm band: heading + body left, pill email field right (stacks on mobile). */
export function NewsletterSection({ section }: { section: HomeSectionOf<"newsletter"> }) {
  const c = section.config;
  return (
    <section className="container-x section-y">
      <Reveal className="grid grid-cols-1 gap-8 rounded-xl bg-surface-warm px-6 py-12 sm:px-12 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-16 lg:py-16">
        <div>
          {section.title && <p className="t-overline mb-3">{section.title}</p>}
          <HeadingLines line={c.heading} />
          {c.body && <p className="mt-4 max-w-md text-body-lg text-ink-soft">{c.body}</p>}
        </div>
        <NewsletterPill placeholder={c.placeholder} buttonLabel={c.buttonLabel} consentText={c.consentText} />
      </Reveal>
    </section>
  );
}
