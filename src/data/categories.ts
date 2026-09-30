import type { Category } from "@/types/domain";

const img = (id: string, alt: string) => ({ url: `https://images.unsplash.com/photo-${id}?w=1200&q=80`, alt });

/** Two top-level departments; children are the filterable sub-categories (for sneakers: silhouette). */
export const categories: Category[] = [
  {
    id: "cat_clothing", name: "Clothing", slug: "clothing", parentId: null, sortOrder: 1,
    description: "Heavyweight cotton, washed linen and technical shells, cut in Tirupur for Indian weather.",
    image: img("1490481651871-ab68de25d43d", "A rail of neutral-toned garments in a studio"),
    seo: { title: "Clothing", description: "Tees, shirts, sweats, trousers and outerwear from wavy." },
  },
  {
    id: "cat_sneakers", name: "Sneakers", slug: "sneakers", parentId: null, sortOrder: 2,
    description: "Low-tops, high-tops and runners. Cushioned for city miles, finished like leather goods.",
    image: img("1549298916-b41d501d3772", "A pair of sneakers on a warm neutral background"),
    seo: { title: "Sneakers", description: "Low-top, high-top and running sneakers from wavy." },
  },
  { id: "cat_tees", name: "T-Shirts", slug: "t-shirts", parentId: "cat_clothing", sortOrder: 1 },
  { id: "cat_shirts", name: "Shirts", slug: "shirts", parentId: "cat_clothing", sortOrder: 2 },
  { id: "cat_sweats", name: "Hoodies & Sweats", slug: "hoodies-sweats", parentId: "cat_clothing", sortOrder: 3 },
  { id: "cat_knit", name: "Knitwear", slug: "knitwear", parentId: "cat_clothing", sortOrder: 4 },
  { id: "cat_trousers", name: "Trousers & Denim", slug: "trousers-denim", parentId: "cat_clothing", sortOrder: 5 },
  { id: "cat_outerwear", name: "Outerwear", slug: "outerwear", parentId: "cat_clothing", sortOrder: 6 },
  { id: "cat_low", name: "Low-top", slug: "low-top", parentId: "cat_sneakers", sortOrder: 1 },
  { id: "cat_high", name: "High-top", slug: "high-top", parentId: "cat_sneakers", sortOrder: 2 },
  { id: "cat_runner", name: "Runner", slug: "runner", parentId: "cat_sneakers", sortOrder: 3 },
];
