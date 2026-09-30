import { AnnouncementBar, Footer, Header } from "@/components/layout";
import { CartDrawer } from "@/components/commerce";
import { getProducts } from "@/backend/catalog/repo";
import { bundleOffer } from "@/data/content";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [bundle, bestsellers] = await Promise.all([
    getProducts({ collectionId: bundleOffer.collectionId }),
    getProducts({ inStock: true, sort: "rating" }),
  ]);
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-ink focus:px-4 focus:py-2 focus:text-on-dark">
        Skip to content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <CartDrawer bundleIds={bundle.map((p) => p.id)} crossSells={[...bundle.slice(0, 2), ...bestsellers.slice(0, 4)]} />
    </>
  );
}
