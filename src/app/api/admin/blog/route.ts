import { ok, parse, route } from "@/backend/_core/http";
import { guard, query } from "@/backend/admin/_shared";
import { createBlogPost, listBlogPosts } from "@/backend/admin/blog";
import { BlogListQuery, BlogPostSchema } from "@/backend/admin/schemas/content";

export const GET = route("admin.blog", async ({ req }) => ok(await listBlogPosts(query(req, BlogListQuery))));

/** status published/scheduled also needs blog.publish. */
export const POST = route("admin.blog", async ({ req }) => {
  const actor = await guard("blog.write");
  return ok(await createBlogPost(actor, await parse(req, BlogPostSchema)), { status: 201 });
});
