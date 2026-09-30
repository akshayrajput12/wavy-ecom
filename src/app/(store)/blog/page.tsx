import type { Metadata } from "next";
import { listBlogPosts } from "@/backend/content/repo";
import { blogCopy } from "@/data/copy";
import { BlogView } from "@/views/blog/BlogView";

export const metadata: Metadata = { title: blogCopy.title, alternates: { canonical: "/blog" } };

export default async function BlogRoute({ searchParams }: PageProps<"/blog">) {
  const sp = await searchParams;
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  return <BlogView posts={await listBlogPosts({ page })} params={sp} />;
}
