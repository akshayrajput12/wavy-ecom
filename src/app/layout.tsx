import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans, Urbanist } from "next/font/google";
import { Toaster } from "sonner";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { getStoreSettings } from "@/backend/settings/repo";
import { siteConfig } from "@/lib/site";
import "./globals.css";

// UI/body: soft geometric sans. Display: tight geometric grotesk for every heading. Mono: indices and counters.
const sans = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const display = Urbanist({ variable: "--font-urbanist", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const name = (await getStoreSettings())?.storeName ?? "Store";
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: name, template: `%s · ${name}` },
    openGraph: { siteName: name, type: "website", locale: "en_IN" },
  };
}

// ponytail: the meta tag needs a literal value; mirrors --canvas in globals.css
export const viewport: Viewport = { themeColor: "#f3f1ec" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SmoothScroll />
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
