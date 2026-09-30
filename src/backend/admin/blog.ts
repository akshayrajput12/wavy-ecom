import "server-only";
import type { z } from "zod";
import type { AdminBlogCategory, AdminBlogPost, Paginated } from "@/types/admin";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { type Actor, assertCan, audit, camel, db, exec, maybe, must, notFound, pageRange, read, revalidate, searchTerm, snake } from "./_shared";
import type { BlogListQuery, BlogPostPatchSchema, BlogPostSchema } from "./schemas/content";

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "tag";
const minutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));

async function hydrate(rows: Tables<"blog_posts">[]): Promise<AdminBlogPost[]> {
  const c = db();
  const ids = rows.map((r) => r.id);
  const catIds = [...new Set(rows.map((r) => r.category_id).filter((x): x is string => !!x))];
  const [links, cats] = await Promise.all([
    ids.length ? c.from("blog_post_tags").select("post_id, tag_id").in("post_id", ids).then(must) : [],
    catIds.length ? c.from("blog_categories").select("id, name").in("id", catIds).then(must) : [],
  ]);
  const tagIds = [...new Set(links.map((l) => l.tag_id))];
  const tags = tagIds.length ? must(await c.from("blog_tags").select("id, name").in("id", tagIds)) : [];
  const tagName = new Map(tags.map((t) => [t.id, t.name]));
  const catName = new Map(cats.map((x) => [x.id, x.name]));
  return rows.map(({ search_vector: _sv, ...r }) => ({
    ...camel(r),
    tags: links.filter((l) => l.post_id === r.id).map((l) => tagName.get(l.tag_id) ?? "").filter(Boolean),
    categoryName: r.category_id ? catName.get(r.category_id) ?? null : null,
  }));
}

export const listBlogPosts = (q: z.infer<typeof BlogListQuery>) =>
  read(["blog.write", "blog.publish"], { items: [], total: 0, page: q.page, pageSize: q.pageSize } as Paginated<AdminBlogPost>, async () => {
    const [from, to] = pageRange(q.page, q.pageSize);
    let b = db().from("blog_posts").select("*", { count: "exact" }).order("updated_at", { ascending: false });
    if (q.status) b = b.eq("status", q.status);
    const term = searchTerm(q.q);
    if (term) b = b.or(`title.ilike."%${term}%",slug.ilike."%${term}%"`);
    const res = await b.range(from, to);
    return { items: await hydrate(must(res)), total: res.count ?? 0, page: q.page, pageSize: q.pageSize };
  });

async function loadPost(id: string) {
  const row = maybe(await db().from("blog_posts").select("*").eq("id", id).maybeSingle());
  return row ? (await hydrate([row]))[0] : null;
}
export const getBlogPost = (id: string) => read(["blog.write", "blog.publish"], null, () => loadPost(id));
export const listBlogCategories = () => read(["blog.write", "blog.publish"], [] as AdminBlogCategory[], async () =>
  must(await db().from("blog_categories").select("*").order("name")).map(camel));

async function setTags(postId: string, names: string[]) {
  const c = db();
  exec(await c.from("blog_post_tags").delete().eq("post_id", postId));
  if (!names.length) return;
  const rows = [...new Map(names.map((n) => [slugify(n), { name: n, slug: slugify(n) }])).values()];
  const tags = must(await c.from("blog_tags").upsert(rows, { onConflict: "slug", ignoreDuplicates: false }).select("id"));
  exec(await c.from("blog_post_tags").insert(tags.map((t) => ({ post_id: postId, tag_id: t.id }))));
}

/** Publishing or scheduling needs blog.publish (the DB guard is bypassed by the service role, so it is checked here). */
const needsPublish = (status?: string) => status === "published" || status === "scheduled";

export async function createBlogPost(actor: Actor, { tags = [], ...input }: z.infer<typeof BlogPostSchema>) {
  if (needsPublish(input.status)) assertCan(actor, "blog.publish");
  const row = must(await db().from("blog_posts").insert({
    ...snake<TablesInsert<"blog_posts">>(input), author_id: actor.userId, author_name: input.authorName ?? actor.name ?? actor.email ?? "wavy",
    reading_minutes: input.readingMinutes ?? minutes(input.body ?? ""),
  }).select("*").single());
  await setTags(row.id, tags);
  const after = await loadPost(row.id);
  await audit(actor, "blog.create", "blog_posts", row.id, null, after);
  revalidate("content", "home");
  return after;
}

export async function updateBlogPost(actor: Actor, id: string, { tags, ...input }: z.infer<typeof BlogPostPatchSchema>) {
  const before = await loadPost(id);
  if (!before) notFound("Post");
  if (needsPublish(input.status) && input.status !== before.status) assertCan(actor, "blog.publish");
  if (before.status === "scheduled" && input.scheduledFor !== undefined) assertCan(actor, "blog.publish");
  const patch = { ...snake<TablesUpdate<"blog_posts">>(input), ...(input.body !== undefined && input.readingMinutes === undefined ? { reading_minutes: minutes(input.body) } : {}) };
  if (Object.keys(patch).length) exec(await db().from("blog_posts").update(patch).eq("id", id));
  if (tags) await setTags(id, tags);
  const after = await loadPost(id);
  await audit(actor, "blog.update", "blog_posts", id, before, after);
  revalidate("content", "home");
  return after;
}

export async function deleteBlogPost(actor: Actor, id: string) {
  const before = await loadPost(id);
  if (!before) notFound("Post");
  exec(await db().from("blog_posts").delete().eq("id", id));
  await audit(actor, "blog.delete", "blog_posts", id, before, null);
  revalidate("content", "home");
  return { id };
}
