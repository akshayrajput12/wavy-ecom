import type { Metadata } from "next";
import { listFaqs } from "@/backend/content/repo";
import { getStoreSettings } from "@/backend/settings/repo";
import { faqPageCopy } from "@/data/copy";
import { FaqView } from "@/views/content/FaqView";

export const metadata: Metadata = { title: faqPageCopy.title, alternates: { canonical: "/faq" } };

export default async function FaqRoute() {
  const [faqs, settings] = await Promise.all([listFaqs(), getStoreSettings()]);
  const jsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
  return (
    <>
      {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }} />}
      <FaqView faqs={faqs} supportEmail={settings?.supportEmail} />
    </>
  );
}
