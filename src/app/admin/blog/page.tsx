import { getBlogPosts } from "@/backend/admin/repo";
import { BlogView } from "@/views/admin/blog/View";

export const metadata = { title: "Journal" };

export default async function Page() {
  return <BlogView posts={await getBlogPosts()} />;
}
