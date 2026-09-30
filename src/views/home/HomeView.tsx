import type { CollectionPage } from "@/backend/catalog/repo";
import type { BlogPost, Product, Testimonial } from "@/types/domain";
import { Hero } from "./components/Hero";
import { CompleteTheLook } from "./components/CompleteTheLook";
import { BundleBanner, Departments, FeaturedCollection, JournalTeaser, NewArrivals, SocialProof } from "./components/Sections";

export interface HomeData {
  newArrivals: Product[];
  featured: { collection: CollectionPage; products: Product[] } | null;
  look: Product[];
  testimonials: Testimonial[];
  posts: BlogPost[];
}

export function HomeView({ newArrivals, featured, look, testimonials, posts }: HomeData) {
  return (
    <>
      <Hero />
      <NewArrivals products={newArrivals} />
      <Departments />
      {featured && <FeaturedCollection {...featured} />}
      <CompleteTheLook products={look} />
      <BundleBanner />
      <SocialProof testimonials={testimonials} />
      <JournalTeaser posts={posts} />
    </>
  );
}
