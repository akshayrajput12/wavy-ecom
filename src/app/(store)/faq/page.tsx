import type { Metadata } from "next";
import { getFaqs } from "@/backend/content/repo";
import { faqCopy } from "@/data/content";
import { FaqView } from "@/views/content/FaqView";

export const metadata: Metadata = { title: faqCopy.title, description: faqCopy.intro };

export default async function FaqRoute() {
  const groups = await getFaqs();
  const jsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: groups.flatMap((g) => g.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } }))),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />
      <FaqView groups={groups} />
    </>
  );
}
