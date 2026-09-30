import type { Metadata } from "next";
import { CartDrawer } from "@/components/commerce";
import { Footer, Header } from "@/components/layout";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Auth, account and public tracking pages: store chrome, never indexed. */
export default function AccountGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="container-x flex-1">{children}</main>
      <Footer />
      <CartDrawer crossSells={[]} bundleIds={[]} />
    </>
  );
}
