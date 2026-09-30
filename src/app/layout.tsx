import type { Metadata, Viewport } from "next";
import { Newsreader, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { getStoreSettings } from "@/backend/settings/repo";
import { siteConfig } from "@/lib/site";
import "./globals.css";

// UI/body: soft geometric sans. Display: low-contrast book serif, used sparingly (.t-hero/.t-display).
const sans = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const serif = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const name = (await getStoreSettings())?.storeName ?? "Store";
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: name, template: `%s · ${name}` },
    openGraph: { siteName: name, type: "website", locale: "en_IN" },
  };
}

// ponytail: the meta tag needs a literal value; mirrors --canvas in globals.css
export const viewport: Viewport = { themeColor: "#faf9f6" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SmoothScroll />
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
