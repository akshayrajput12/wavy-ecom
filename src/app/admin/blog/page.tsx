import { listBlogPosts } from "@/backend/admin/repo";
import { BlogListQuery } from "@/backend/admin/schemas/content";
import { BlogView } from "@/views/admin/blog/View";

export const metadata = { title: "Journal" };

export default async function Page() {
  return <BlogView posts={(await listBlogPosts(BlogListQuery.parse({ pageSize: 100 }))).items} />;
}
