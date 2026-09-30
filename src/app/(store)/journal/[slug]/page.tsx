import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPost, getBlogPosts } from "@/backend/content/repo";
import { ArticleView } from "@/views/journal/ArticleView";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getBlogPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPost((await params).slug);
  if (!post) return {};
  return {
    title: post.seo?.title ?? post.title,
    description: post.seo?.description ?? post.excerpt,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: { type: "article", publishedTime: post.publishedAt, authors: [post.author], images: [post.cover.url] },
  };
}

export default async function ArticleRoute({ params }: Props) {
  const post = await getBlogPost((await params).slug);
  if (!post) notFound();
  const related = (await getBlogPosts()).filter((p) => p.id !== post.id).slice(0, 3);
  return <ArticleView post={post} related={related} />;
}
