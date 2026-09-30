import type { Metadata } from "next";
import { getStoreSettings } from "@/backend/settings/repo";
import { CheckoutHeader } from "@/views/checkout/components/CheckoutHeader";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const settings = await getStoreSettings();
  return (
    <>
      <CheckoutHeader storeName={settings?.storeName ?? "wavy"} supportEmail={settings?.supportEmail} />
      <main id="main" className="container-x flex-1">{children}</main>
    </>
  );
}
