import "server-only";
import { cached, TAGS } from "@/backend/_core/cache";
import { publicDb, safe } from "@/backend/_core/db";
import { listCategories, listCollections } from "@/backend/catalog/repo";
import type { BlogPost, Category, ContentPage, Faq, NavLink, Paginated, Testimonial } from "@/types/domain";
import {
  BLOG_DETAIL_COLS, BLOG_LIST_COLS, TESTIMONIAL_COLS, toBlogPost, toContentPage, toFaq, toTestimonial,
  type BlogRow, type FaqRow, type PageRow, type TestimonialRow,
} from "./mapper";
import { BlogListQuery } from "./schema";

// ---------- Blog ----------
export const listBlogPosts = cached("content.blog.list", [TAGS.blog], async (input: Partial<BlogListQuery> = {}): Promise<Paginated<BlogPost>> => {
  const q = BlogListQuery.parse(input);
  const empty = { items: [], total: 0, page: q.page, pageSize: q.pageSize };
  const db = publicDb();
  if (!db) return empty;
  const joins = [q.category && "cf:blog_categories!inner(slug)", q.tag && "tf:blog_post_tags!inner(t:blog_tags!inner(slug))"];
  let b = db.from("blog_posts").select([BLOG_LIST_COLS, ...joins.filter(Boolean)].join(", "), { count: "exact" });
  if (q.category) b = b.eq("cf.slug", q.category);
  if (q.tag) b = b.eq("tf.t.slug", q.tag);
  const from = (q.page - 1) * q.pageSize;
  const res = await b.order("published_at", { ascending: false }).range(from, from + q.pageSize - 1);
  const rows: BlogRow[] = safe(res, "list blog posts", []);
  return { items: rows.map(toBlogPost), total: res.count ?? rows.length, page: q.page, pageSize: q.pageSize };
});

export const getBlogPost = cached("content.blog.post", [TAGS.blog], async (slug: string): Promise<BlogPost | null> => {
  const db = publicDb();
  if (!db) return null;
  const row: BlogRow | null = safe(await db.from("blog_posts").select(BLOG_DETAIL_COLS).eq("slug", slug).maybeSingle(), "get blog post", null);
  return row ? toBlogPost(row) : null;
});

/** Newest posts sharing the category (topped up with newest overall), excluding the post itself. */
export async function getRelatedPosts(post: Pick<BlogPost, "id" | "category">, limit = 3): Promise<BlogPost[]> {
  const [same, latest] = await Promise.all([
    post.category ? listBlogPosts({ pageSize: limit + 1, category: post.category.slug }) : null,
    listBlogPosts({ pageSize: limit + 1 }),
  ]);
  const all = [...(same?.items ?? []), ...latest.items];
  return [...new Map(all.map((p) => [p.id, p])).values()].filter((p) => p.id !== post.id).slice(0, limit);
}

// ---------- FAQs / pages / testimonials ----------
export const listFaqs = cached("content.faqs", [TAGS.content], async (): Promise<Faq[]> => {
  const db = publicDb();
  if (!db) return [];
  const rows: FaqRow[] = safe(await db.from("faqs").select("id, category, question, answer").order("sort_order"), "list faqs", []);
  return rows.map(toFaq);
});

export const getContentPage = cached("content.page", [TAGS.content], async (slug: string): Promise<ContentPage | null> => {
  const db = publicDb();
  if (!db) return null;
  const row: PageRow | null = safe(
    await db.from("content_pages")
      .select("id, slug, page_type, title, blocks, seo_title, seo_description, og_image_url, canonical_url, noindex")
      .eq("slug", slug).maybeSingle(),
    "get content page", null,
  );
  return row ? toContentPage(row) : null;
});

const listPagesLite = cached("content.pages", [TAGS.content], async (): Promise<{ slug: string; title: string }[]> => {
  const db = publicDb();
  if (!db) return [];
  return safe(await db.from("content_pages").select("slug, title").order("title"), "list content pages", []);
});

/** Published testimonials in sort order; with `ids`, exactly those in the given order. */
export const listTestimonials = cached("content.testimonials", [TAGS.content], async (limit: number = 12, ids?: string[]): Promise<Testimonial[]> => {
  const db = publicDb();
  if (!db) return [];
  let b = db.from("testimonials").select(TESTIMONIAL_COLS);
  if (ids?.length) b = b.in("id", ids);
  const rows: TestimonialRow[] = safe(await b.order("sort_order").limit(ids?.length || limit), "list testimonials", []);
  const list = rows.map(toTestimonial);
  return ids?.length ? ids.flatMap((id) => list.find((t) => t.id === id) ?? []) : list;
});

// ---------- Navigation ----------
export interface Navigation {
  /** Category tree as links (/collections/<slug>), roots in sort order. */
  categories: NavLink[];
  /** Active collections (/collections/<slug>). */
  collections: NavLink[];
  /** Published content pages (/<slug>, e.g. /about, /faq). */
  pages: NavLink[];
}

const categoryLink = (c: Category): NavLink => ({
  label: c.name, href: `/collections/${c.slug}`,
  ...(c.children?.length ? { children: c.children.map(categoryLink) } : {}),
});

/** Header/footer data derived from categories, collections and content pages. Group headings are UI copy. */
export async function getNavigation(): Promise<Navigation> {
  const [tree, cols, pages] = await Promise.all([listCategories(), listCollections(), listPagesLite()]);
  return {
    categories: tree.map(categoryLink),
    collections: cols.map((c) => ({ label: c.name, href: `/collections/${c.slug}` })),
    pages: pages.map((p) => ({ label: p.title, href: `/${p.slug}` })),
  };
}
