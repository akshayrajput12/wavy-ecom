import type { Category, Collection, Product, ProductVariant } from "@/types/domain";

// ponytail: admin demo catalog. Swap for `products` from @/data/products once the storefront agent ships it.
const PHOTOS = ["photo-1521572163474-6864f9cf17ab", "photo-1542291026-7eec264c27ff", "photo-1473966968600-fa801b869a1a", "photo-1434389677669-e08b4cac3105"];
const img = (seed: string, i: number) => ({ url: `https://images.unsplash.com/${PHOTOS[i % PHOTOS.length]}?w=400&q=70`, alt: seed });

function variants(productId: string, sku: string, price: number, colors: string[], sizes: string[], stock: number[]): ProductVariant[] {
  return colors.flatMap((color, ci) =>
    sizes.map((size, si) => {
      const s = stock[(ci * sizes.length + si) % stock.length];
      return {
        id: `${productId}-${ci}-${si}`, productId, sku: `${sku}-${color.slice(0, 3).toUpperCase()}-${size}`,
        color, size, price, stock: s, status: s === 0 ? "out_of_stock" : "active",
      } satisfies ProductVariant;
    }),
  );
}

export const adminCategories: Category[] = [
  { id: "cat-clothing", name: "Clothing", slug: "clothing", parentId: null, sortOrder: 1 },
  { id: "cat-tees", name: "T-shirts", slug: "t-shirts", parentId: "cat-clothing", sortOrder: 1 },
  { id: "cat-hoodies", name: "Hoodies & Sweats", slug: "hoodies", parentId: "cat-clothing", sortOrder: 2 },
  { id: "cat-bottoms", name: "Bottoms", slug: "bottoms", parentId: "cat-clothing", sortOrder: 3 },
  { id: "cat-sneakers", name: "Sneakers", slug: "sneakers", parentId: null, sortOrder: 2 },
  { id: "cat-lowtops", name: "Low-tops", slug: "low-tops", parentId: "cat-sneakers", sortOrder: 1 },
  { id: "cat-runners", name: "Runners", slug: "runners", parentId: "cat-sneakers", sortOrder: 2 },
];

export const adminCollections: Collection[] = [
  { id: "col-essentials", name: "Everyday Essentials", slug: "essentials" },
  { id: "col-new", name: "New In", slug: "new-in" },
  { id: "col-monsoon", name: "Monsoon Edit", slug: "monsoon-edit" },
];

const clothingSizes = ["S", "M", "L", "XL"];
const shoeSizes = ["UK7", "UK8", "UK9", "UK10"];

type Seed = [id: string, name: string, descriptor: string, cat: string, price: number, colors: string[], stock: number[], status: Product["status"], tryOn: boolean];
const seeds: Seed[] = [
  ["p-core-tee", "Core Heavyweight Tee", "240 GSM combed cotton", "cat-tees", 129900, ["Ecru", "Black"], [24, 18, 3, 0, 40, 12, 9, 6], "published", true],
  ["p-daybreak-hoodie", "Daybreak Hoodie", "Brushed fleece, relaxed fit", "cat-hoodies", 349900, ["Bone"], [4, 7, 2, 11], "published", true],
  ["p-cargo", "Modular Cargo Pant", "Ripstop, six pockets", "cat-bottoms", 279900, ["Olive", "Slate"], [14, 9, 6, 2, 0, 5, 8, 3], "published", false],
  ["p-studio-runner", "Studio Runner 01", "Suede overlays, EVA sole", "cat-runners", 699900, ["Bone", "Grey"], [5, 2, 7, 1, 9, 4, 0, 6], "published", true],
  ["p-court-low", "Court Low", "Full-grain leather", "cat-lowtops", 549900, ["White"], [12, 16, 8, 3], "published", false],
  ["p-boxy-shirt", "Boxy Linen Shirt", "Washed linen, camp collar", "cat-tees", 219900, ["Sand", "Sky"], [0, 3, 5, 2, 7, 1, 0, 4], "draft", false],
  ["p-track-short", "Track Short", "Quick-dry nylon", "cat-bottoms", 149900, ["Black"], [30, 22, 18, 9], "unpublished", false],
  ["p-trail-runner", "Trail Runner 02", "Lugged outsole", "cat-runners", 749900, ["Moss"], [0, 0, 1, 2], "archived", false],
];

export const adminProducts: Product[] = seeds.map(([id, name, descriptor, categoryId, price, colors, stock, status, tryOnEnabled], i) => {
  const vs = variants(id, id.replace("p-", "").toUpperCase(), price, colors, categoryId.includes("runner") || categoryId.includes("low") ? shoeSizes : clothingSizes, stock);
  return {
    id, name, slug: id.replace("p-", ""), descriptor, description: `${name} — ${descriptor}.`,
    categoryId, collectionIds: ["col-essentials"], images: [img(name, i)], badges: [], status,
    seo: { title: `${name} | wavy`, description: `Shop the ${name}: ${descriptor}. Free shipping over ₹1,499.` },
    rating: 4.5, reviewCount: 32, tryOnEnabled, priceFrom: price, variants: vs,
  };
});

export const inventoryReasons = ["Stock count correction", "Received purchase order", "Damaged / QC reject", "Return restocked", "Transfer between locations"];
