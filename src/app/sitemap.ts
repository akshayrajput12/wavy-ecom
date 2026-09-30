import type { MetadataRoute } from "next";
import { getCategories, getCollections, getProducts } from "@/backend/catalog/repo";
import { getBlogPosts } from "@/backend/content/repo";
import { site } from "@/data/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, cats, cols, posts] = await Promise.all([getProducts(), getCategories(), getCollections(), getBlogPosts()]);
  const url = (path: string) => `${site.url}${path}`;
  const statics = ["", "/editorial", "/new-in", "/collections", "/lookbook", "/journal", "/about", "/faq"];
  return [
    ...statics.map((p) => ({ url: url(p), changeFrequency: "weekly" as const, priority: p ? 0.7 : 1 })),
    ...[...cats.filter((c) => !c.parentId), ...cols].map((c) => ({ url: url(`/collections/${c.slug}`), changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: url(`/products/${p.slug}`), changeFrequency: "daily" as const, priority: 0.9, images: [p.images[0].url] })),
    ...posts.map((p) => ({ url: url(`/journal/${p.slug}`), lastModified: p.publishedAt, priority: 0.5 })),
  ];
}
