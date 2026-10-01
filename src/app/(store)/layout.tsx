import { AnnouncementBar, Footer, Header, StoreMain } from "@/components/layout";
import { Preloader } from "@/components/layout/Preloader";
import { CartDrawer, FloatingProductCard, QuickViewHost } from "@/components/commerce";
import { getSpotlight } from "@/backend/catalog/repo";
import { getStoreSettings } from "@/backend/settings/repo";
import { layoutCopy } from "@/data/storefront";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, spotlight] = await Promise.all([getStoreSettings(), getSpotlight()]);
  return (
    <>
      <Preloader storeName={settings?.storeName ?? layoutCopy.storeFallback} logoUrl={settings?.logoDarkUrl} />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-ink focus:px-4 focus:py-2 focus:text-on-dark">
        {layoutCopy.skip}
      </a>
      <Header />
      <StoreMain announcement={<AnnouncementBar />}>{children}</StoreMain>
      <Footer />
      <CartDrawer freeShippingThreshold={settings?.freeShippingThreshold} />
      <FloatingProductCard items={spotlight} />
      <QuickViewHost />
    </>
  );
}
