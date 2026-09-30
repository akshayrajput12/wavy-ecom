"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Accordion } from "@/components/ui/Controls";
import { faqCopy as c } from "@/data/content";
import { site } from "@/data/site";
import type { FaqGroup } from "@/backend/content/repo";

/** Screen 38 — categorised, searchable questions. */
export function FaqView({ groups }: { groups: FaqGroup[] }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const filtered = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => !term || `${i.q} ${i.a}`.toLowerCase().includes(term)) }))
    .filter((g) => g.items.length);

  return (
    <div className="container-x grid gap-10 pb-24 pt-10 lg:grid-cols-12 lg:gap-5 lg:pt-16">
      <aside className="lg:col-span-4">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <h1 className="t-hero">{c.title}</h1>
          <p className="mt-4 max-w-sm text-body-lg text-ink-soft">{c.intro}</p>
          <nav aria-label="FAQ sections" className="mt-8 hidden lg:block">
            <ul className="space-y-2">
              {groups.map((g) => <li key={g.id}><a href={`#${g.id}`} className="text-body text-ink-soft hover:text-ink">{g.title}</a></li>)}
            </ul>
          </nav>
          <a href={`mailto:${site.supportEmail}`} className="mt-8 inline-block text-body font-medium underline underline-offset-4">{c.contact} — {site.supportEmail}</a>
        </div>
      </aside>
      <div className="lg:col-span-7 lg:col-start-6">
        <label htmlFor="faq-q" className="sr-only">{c.searchLabel}</label>
        <div className="flex items-center gap-3 rounded-pill border border-line bg-surface px-5 focus-within:border-ink">
          <Search className="size-4 text-ink-soft" aria-hidden />
          <input id="faq-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={c.searchPlaceholder} className="h-12 flex-1 bg-transparent text-body focus:outline-none" />
        </div>
        {filtered.length === 0 && <p role="status" className="py-12 text-body text-ink-soft">{c.noResults}</p>}
        {filtered.map((g) => (
          <section key={g.id} id={g.id} className="mt-12 scroll-mt-24">
            <h2 className="t-overline text-ink-soft">{g.title}</h2>
            <div className="mt-2 border-t border-line">
              {g.items.map((i) => <Accordion key={i.q} title={i.q} defaultOpen={!!term}>{i.a}</Accordion>)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
