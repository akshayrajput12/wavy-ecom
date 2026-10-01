import { ok, parse, route } from "@/backend/_core/http";
import { bulkDeleteRoute } from "@/backend/admin/remove";
import { guard, query } from "@/backend/admin/_shared";
import { createBlogPost, listBlogPosts } from "@/backend/admin/blog";
import { BlogListQuery, BlogPostSchema } from "@/backend/admin/schemas/content";

export const GET = route("admin.blog", async ({ req }) => ok(await listBlogPosts(query(req, BlogListQuery))));

/** status published/scheduled also needs blog.publish. */
export const POST = route("admin.blog", async ({ req }) => {
  const actor = await guard("blog.write");
  return ok(await createBlogPost(actor, await parse(req, BlogPostSchema)), { status: 201 });
});

/** Bulk delete `{ids}` (1-200); see backend/admin/remove.ts for how dependent data is handled. */
export const DELETE = bulkDeleteRoute("admin.blog", "blog");
