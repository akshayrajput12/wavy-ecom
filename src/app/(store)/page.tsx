import { getCollection, getProducts, getProductsByIds } from "@/backend/catalog/repo";
import { getBlogPosts, getTestimonials } from "@/backend/content/repo";
import { home } from "@/data/home";
import { HomeView } from "@/views/home/HomeView";

export default async function HomePage() {
  const collection = await getCollection(home.featured.slug);
  const [newArrivals, featuredProducts, look, testimonials, posts] = await Promise.all([
    getProducts({ sort: "newest" }),
    collection ? getProducts(collection.scope) : Promise.resolve([]),
    getProductsByIds(home.completeTheLook.items.map((i) => i.productId)),
    getTestimonials(),
    getBlogPosts(3),
  ]);
  return (
    <HomeView
      newArrivals={newArrivals.slice(0, 8)}
      featured={collection ? { collection, products: featuredProducts } : null}
      look={look}
      testimonials={testimonials}
      posts={posts}
    />
  );
}
