"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { faqPageCopy as c } from "@/data/copy";
import type { Faq } from "@/types/domain";
import { anchor, groupsOf } from "../faq";
import { FaqItem } from "./FaqItem";

/** Searchable FAQ accordion grouped by category (FAQ page and the `faq_list` content block). */
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
        <section key={category} id={anchor(category)} aria-labelledby={`${anchor(category)}-h`} className="mt-12 scroll-mt-[calc(var(--header-h)+1.5rem)]">
          <h2 id={`${anchor(category)}-h`} className="t-overline">{category}</h2>
          <div className="mt-3 border-t border-line">
            {/* key on the search state so matches open while searching and collapse when it clears */}
            {items.map((f) => <FaqItem key={`${f.id}-${!!term}`} question={f.question} answer={f.answer} defaultOpen={!!term} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
