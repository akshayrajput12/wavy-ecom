import { faqPageCopy as c } from "@/data/copy";
import type { Faq } from "@/types/domain";
import { FaqList } from "./components/FaqList";
import { anchor, groupsOf } from "./faq";

/** Two columns: sticky intro (overline, 2-line heading, lede, topics, contact) + accordion. */
export function FaqView({ faqs, supportEmail }: { faqs: Faq[]; supportEmail?: string }) {
  const categories = groupsOf(faqs).map(([name]) => name);
  return (
    <div className="container-x grid gap-10 pb-24 pt-12 lg:grid-cols-12 lg:gap-5 lg:pt-16">
      <aside className="lg:col-span-4">
        <div className="grid gap-4 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <p className="t-overline">{c.overline}</p>
          <h1 className="t-display">{c.heading[0]}<br />{c.heading[1]}</h1>
          <p className="max-w-sm text-body text-ink-soft">{c.lede}</p>
          {categories.length > 1 && (
            <nav aria-label={c.topics} className="mt-4 hidden lg:block">
              <ul className="border-t border-line">
                {categories.map((g, i) => (
                  <li key={g} className="border-b border-line">
                    <a href={`#${anchor(g)}`} className="flex min-h-11 items-center gap-3 text-body text-ink-soft hover:text-ink">
                      <span className="t-index">{String(i + 1).padStart(2, "0")}</span>{g}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          {supportEmail && (
            <a href={`mailto:${supportEmail}`} className="mt-2 inline-flex min-h-11 items-center self-start text-meta font-medium underline underline-offset-4">
              {c.contact}: {supportEmail}
            </a>
          )}
        </div>
      </aside>
      <div className="lg:col-span-7 lg:col-start-6"><FaqList faqs={faqs} /></div>
    </div>
  );
}
