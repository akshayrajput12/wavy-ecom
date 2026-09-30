/** Content rows -> domain (pure). */
import type { BlogPost, ContentPage, Faq, Testimonial } from "@/types/domain";
import { toMedia, toSeo } from "@/backend/catalog/mapper";

interface SeoCols { seo_title: string | null; seo_description: string | null; og_image_url: string | null; canonical_url: string | null; noindex: boolean }

export const BLOG_LIST_COLS =
  "id, slug, title, excerpt, cover_url, cover_alt, published_at, author_name, reading_minutes, " +
  "category:blog_categories(name, slug), tags:blog_post_tags(tag:blog_tags(name, slug))";
export const BLOG_DETAIL_COLS = `${BLOG_LIST_COLS}, body, seo_title, seo_description, og_image_url, canonical_url, noindex`;

export interface BlogRow extends Partial<SeoCols> {
  id: string; slug: string; title: string; excerpt: string; cover_url: string | null; cover_alt: string;
  body?: string; published_at: string | null; author_name: string; reading_minutes: number | null;
  category: { name: string; slug: string } | null;
  tags: { tag: { name: string; slug: string } | null }[] | null;
}
export const toBlogPost = (r: BlogRow): BlogPost => ({
  id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, cover: toMedia(r.cover_url, r.cover_alt), body: r.body ?? "",
  author: r.author_name, publishedAt: r.published_at ?? "", readingMinutes: r.reading_minutes ?? undefined,
  category: r.category ?? undefined, tags: (r.tags ?? []).flatMap((t) => (t.tag ? [t.tag.name] : [])),
  seo: toSeo(r),
});

export const TESTIMONIAL_COLS = "id, author_name, author_role, quote, avatar_url, rating";
export interface TestimonialRow { id: string; author_name: string; author_role: string | null; quote: string; avatar_url: string | null; rating: number | null }
export const toTestimonial = (r: TestimonialRow): Testimonial => ({
  id: r.id, author: r.author_name, role: r.author_role ?? undefined, quote: r.quote,
  avatar: toMedia(r.avatar_url, r.author_name), rating: r.rating ?? undefined,
});

export interface FaqRow { id: string; category: string; question: string; answer: string }
export const toFaq = (r: FaqRow): Faq => ({ id: r.id, category: r.category, question: r.question, answer: r.answer });

export interface PageRow extends SeoCols { id: string; slug: string; page_type: string; title: string; blocks: unknown }
export const toContentPage = (r: PageRow): ContentPage => ({
  id: r.id, slug: r.slug, pageType: r.page_type, title: r.title, blocks: r.blocks, seo: toSeo(r),
});
