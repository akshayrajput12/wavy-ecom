import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPost, getRelatedPosts } from "@/backend/content/repo";
import { ArticleView } from "@/views/blog/ArticleView";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await getBlogPost((await params).slug);
  if (!post) return {};
  return {
    title: post.seo?.title ?? post.title,
    description: post.seo?.description ?? post.excerpt,
    alternates: { canonical: post.seo?.canonical ?? `/blog/${post.slug}` },
    openGraph: { type: "article", publishedTime: post.publishedAt, authors: [post.author], images: post.cover ? [post.cover.url] : undefined },
  };
}

export default async function ArticleRoute({ params }: PageProps<"/blog/[slug]">) {
  const post = await getBlogPost((await params).slug);
  if (!post) notFound();
  return <ArticleView post={post} related={await getRelatedPosts(post, 3)} />;
}
