import type { Metadata } from "next";
import { getStoreSettings } from "@/backend/settings/repo";
import { CartDrawer } from "@/components/commerce/cart/CartDrawer";
import { Footer, Header } from "@/components/layout";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Auth, account and public tracking pages: store chrome, never indexed. */
export default async function AccountGroupLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();
  return (
    <>
      <Header />
      <main id="main" className="container-x flex-1 pt-(--header-h)">{children}</main>
      <Footer />
      <CartDrawer freeShippingThreshold={settings?.freeShippingThreshold} />
    </>
  );
}
