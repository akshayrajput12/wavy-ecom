import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";

/**
 * Revalidation tags for public storefront data. After a write, admin code calls
 *   revalidateTag(TAGS.catalog, "max")
 * (Next 16 two-argument form). Every cached read below is also time-revalidated every 5 min unless it passes its own TTL.
 */
export const TAGS = {
  catalog: "catalog",     // products, variants, media, inventory display, categories, collections, redirects
  home: "home",           // home_sections
  content: "content",     // content_pages, faqs, testimonials, navigation
  blog: "blog",           // blog_posts, blog_categories, blog_tags
  reviews: "reviews",     // approved reviews + rating summaries
  settings: "settings",   // store_settings, payment_gateways
  shipping: "shipping",   // shipping_zones, shipping_methods
  geo: "geo",             // pincode / geocoder lookups (external, long TTL)
} as const;
export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

const REVALIDATE_SECONDS = 300;

/** Cross-request cache (unstable_cache, tagged) + per-request dedupe (React cache). Args must be JSON-serialisable. A thrown error is not cached. */
export function cached<A extends unknown[], R>(key: string, tags: CacheTag[], fn: (...args: A) => Promise<R>, revalidate = REVALIDATE_SECONDS) {
  return cache(unstable_cache(fn, [key], { tags, revalidate }));
}
