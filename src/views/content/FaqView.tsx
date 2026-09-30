"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Accordion } from "@/components/ui/Controls";
import { faqPageCopy as c } from "@/data/copy";
import type { Faq } from "@/types/domain";

const groupsOf = (faqs: Faq[]) => [...faqs.reduce((m, f) => m.set(f.category, [...(m.get(f.category) ?? []), f]), new Map<string, Faq[]>())];
const anchor = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

/** Searchable FAQ list grouped by category (also used by the `faq_list` content block). */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const groups = groupsOf(faqs.filter((f) => !term || `${f.question} ${f.answer}`.toLowerCase().includes(term)));
  if (!faqs.length) return <p className="py-10 text-body text-ink-soft">{c.empty}</p>;
  return (
    <div>
      <label htmlFor="faq-q" className="sr-only">{c.searchLabel}</label>
      <div className="flex items-center gap-3 rounded-pill border border-line bg-surface px-5 focus-within:border-ink">
        <Search className="size-4 text-ink-soft" aria-hidden />
        <input id="faq-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={c.searchPlaceholder} className="h-12 flex-1 bg-transparent text-body focus:outline-none" />
      </div>
      {groups.length === 0 && <p role="status" className="py-12 text-body text-ink-soft">{c.noResults}</p>}
      {groups.map(([category, items]) => (
        <section key={category} id={anchor(category)} className="mt-10 scroll-mt-24">
          <h2 className="t-overline text-ink-soft">{category}</h2>
          <div className="mt-2 border-t border-line">
            {items.map((f) => <Accordion key={f.id} title={f.question} defaultOpen={!!term}><p className="whitespace-pre-line">{f.answer}</p></Accordion>)}
          </div>
        </section>
      ))}
    </div>
  );
}

export function FaqView({ faqs, supportEmail }: { faqs: Faq[]; supportEmail?: string }) {
  const categories = groupsOf(faqs).map(([name]) => name);
  return (
    <div className="container-x grid gap-10 pb-24 pt-10 lg:grid-cols-12 lg:gap-5 lg:pt-16">
      <aside className="lg:col-span-4">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <h1 className="t-hero">{c.title}</h1>
          {categories.length > 1 && (
            <nav aria-label={c.title} className="mt-8 hidden lg:block">
              <ul className="space-y-2">{categories.map((g) => <li key={g}><a href={`#${anchor(g)}`} className="text-body text-ink-soft hover:text-ink">{g}</a></li>)}</ul>
            </nav>
          )}
          {supportEmail && <a href={`mailto:${supportEmail}`} className="mt-8 inline-block text-body font-medium underline underline-offset-4">{c.contact}: {supportEmail}</a>}
        </div>
      </aside>
      <div className="lg:col-span-7 lg:col-start-6"><FaqList faqs={faqs} /></div>
    </div>
  );
}
