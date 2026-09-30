import type { Metadata } from "next";
import { CheckoutHeader } from "@/views/checkout/components/CheckoutHeader";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CheckoutHeader />
      <main className="container-x flex-1">{children}</main>
    </>
  );
}
