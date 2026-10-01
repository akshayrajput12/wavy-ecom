import { homeCopy } from "@/data/storefront";
import type { Faq } from "@/types/domain";
import { FaqAccordion } from "./FaqAccordion";
import { HeadingLines } from "./HeadingLines";
import { MoreLink } from "./SectionHead";

/** "Questions, answered.": intro + link to /faq on the left, a few FAQs in an accordion on the right. */
export function FaqPreview({ faqs }: { faqs: Faq[] }) {
  if (!faqs.length) return null;
  const c = homeCopy.faq;
  return (
    <section className="container-x section-y grid gap-10 lg:grid-cols-12 lg:gap-6">
      <div className="flex flex-col lg:col-span-4">
        <p className="t-overline mb-3">{c.overline}</p>
        <HeadingLines line={c.title} className="max-w-sm" />
        <p className="mt-5 max-w-xs text-body text-ink-soft">{c.body}</p>
        <div className="mt-4"><MoreLink cta={{ label: c.all, href: "/faq" }} /></div>
      </div>
      <FaqAccordion faqs={faqs} className="lg:col-span-7 lg:col-start-6" />
    </section>
  );
}
