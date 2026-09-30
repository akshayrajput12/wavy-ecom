import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound } from "@/backend/admin/_shared";
import { deleteBlogPost, getBlogPost, updateBlogPost } from "@/backend/admin/blog";
import { BlogPostPatchSchema } from "@/backend/admin/schemas/content";

type P = { id: string };

export const GET = route<P>("admin.blog", async ({ params }) => ok((await getBlogPost(params.id)) ?? notFound("Post")));

export const PATCH = route<P>("admin.blog", async ({ req, params }) => {
  const actor = await guard("blog.write");
  return ok(await updateBlogPost(actor, params.id, await parse(req, BlogPostPatchSchema)));
});

export const DELETE = route<P>("admin.blog", async ({ params }) => {
  const actor = await guard("blog.write");
  return ok(await deleteBlogPost(actor, params.id));
});
