import type { Metadata } from "next";
import { getProductsByIds } from "@/backend/catalog/repo";
import { getBlogPosts } from "@/backend/content/repo";
import { editorial } from "@/data/home";
import { EditorialView } from "@/views/home-editorial/EditorialView";

export const metadata: Metadata = { title: `${editorial.issue} — ${editorial.season}`, description: editorial.intro };

export default async function EditorialPage() {
  const [picks, posts] = await Promise.all([getProductsByIds(editorial.picks), getBlogPosts(3)]);
  return <EditorialView picks={picks} posts={posts} />;
}
