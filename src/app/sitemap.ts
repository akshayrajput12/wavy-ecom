import type { MetadataRoute } from "next";
import { listCategoriesFlat, listCollections, listProducts } from "@/backend/catalog/repo";
import { productQueryFrom } from "@/backend/catalog/schema";
import { getNavigation, listBlogPosts } from "@/backend/content/repo";
import { siteConfig } from "@/lib/site";
import type { BlogPost, Product } from "@/types/domain";

// ponytail: pages through at most MAX_PAGES x 60 products / 50 posts; split into sitemap indexes past that.
const MAX_PAGES = 50;

async function allProducts(): Promise<Product[]> {
  const out: Product[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await listProducts(productQueryFrom({}, { page, pageSize: 60 }), false);
    out.push(...r.items);
    if (out.length >= r.total || !r.items.length) break;
  }
  return out;
}

async function allPosts(): Promise<BlogPost[]> {
  const out: BlogPost[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const r = await listBlogPosts({ page, pageSize: 50 });
    out.push(...r.items);
    if (out.length >= r.total || !r.items.length) break;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections, posts, nav] = await Promise.all([allProducts(), listCategoriesFlat(), listCollections(), allPosts(), getNavigation()]);
  const url = (path: string) => `${siteConfig.url}${path}`;
  return [
    ...["", "/collections", "/blog", "/faq"].map((p) => ({ url: url(p), changeFrequency: "weekly" as const, priority: p ? 0.6 : 1 })),
    ...nav.pages.filter((p) => p.href !== "/faq").map((p) => ({ url: url(p.href), changeFrequency: "monthly" as const, priority: 0.4 })),
    ...[...categories.filter((c) => c.isActive && !c.seo?.noindex), ...collections.filter((c) => !c.seo?.noindex)]
      .map((c) => ({ url: url(`/collections/${c.slug}`), changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.filter((p) => !p.seo?.noindex).map((p) => ({
      url: url(`/products/${p.slug}`), changeFrequency: "daily" as const, priority: 0.9, images: p.images[0] ? [p.images[0].url] : undefined,
    })),
    ...posts.map((p) => ({ url: url(`/blog/${p.slug}`), lastModified: p.publishedAt, priority: 0.5 })),
  ];
}
