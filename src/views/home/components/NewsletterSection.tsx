import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { Reveal } from "@/components/ui/Reveal";
import type { HomeSectionOf } from "@/types/domain";

export function NewsletterSection({ section }: { section: HomeSectionOf<"newsletter"> }) {
  const c = section.config;
  return (
    <section className="container-x section-y">
      <Reveal className="mx-auto max-w-2xl rounded-xl bg-accent-soft px-6 py-12 text-center sm:px-12">
        <h2 className="t-display">{c.heading}</h2>
        {c.body && <p className="mx-auto mt-3 max-w-md text-body-lg text-ink-soft">{c.body}</p>}
        <div className="mx-auto max-w-md text-left">
          <NewsletterForm placeholder={c.placeholder} buttonLabel={c.buttonLabel} consentText={c.consentText} />
        </div>
      </Reveal>
    </section>
  );
}
