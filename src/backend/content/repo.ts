import "server-only";
import { hasSupabase } from "@/lib/env";
import { blogPosts } from "@/data/journal";
import { faqs, lookbook } from "@/data/content";
import { testimonials } from "@/data/reviews";
import type { BlogPost, Testimonial } from "@/types/domain";

export type FaqGroup = (typeof faqs)[number];
export type Lookbook = typeof lookbook;

export async function getFaqs(): Promise<FaqGroup[]> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  return faqs;
}

export async function getLookbook(): Promise<Lookbook> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  return lookbook;
}

export async function getBlogPosts(limit?: number): Promise<BlogPost[]> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  const sorted = [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return limit ? sorted.slice(0, limit) : sorted;
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  return blogPosts.find((p) => p.slug === slug) ?? null;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (hasSupabase) { /* TODO(backend agent): query supabase */ }
  return testimonials;
}
