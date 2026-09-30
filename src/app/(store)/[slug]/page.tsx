import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContentPage, listFaqs } from "@/backend/content/repo";
import { ContentPageView, parseBlocks } from "@/views/content/ContentPageView";

/** Any published content page by slug: /about, /shipping, /privacy… (static routes take precedence). */
export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const page = await getContentPage((await params).slug);
  if (!page) return {};
  return {
    title: page.seo?.title ?? page.title,
    description: page.seo?.description,
    alternates: { canonical: page.seo?.canonical ?? `/${page.slug}` },
    robots: page.seo?.noindex ? { index: false } : undefined,
  };
}

export default async function ContentRoute({ params }: PageProps<"/[slug]">) {
  const page = await getContentPage((await params).slug);
  if (!page) notFound();
  const needsFaqs = parseBlocks(page.blocks).some((b) => b.type === "faq_list");
  return <ContentPageView page={page} faqs={needsFaqs ? await listFaqs() : []} />;
}
