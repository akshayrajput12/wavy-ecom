import { AnnouncementBar, Footer, Header } from "@/components/layout";
import { CartDrawer, QuickViewHost } from "@/components/commerce";
import { getStoreSettings } from "@/backend/settings/repo";
import { layoutCopy } from "@/data/storefront";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-ink focus:px-4 focus:py-2 focus:text-on-dark">
        {layoutCopy.skip}
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <CartDrawer freeShippingThreshold={settings?.freeShippingThreshold} />
      <QuickViewHost />
    </>
  );
}
