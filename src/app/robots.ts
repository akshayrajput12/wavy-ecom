import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/cart", "/wishlist", "/search", "/api", "/login", "/signup", "/track"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
