import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist_Mono, Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { getStoreSettings } from "@/backend/settings/repo";
import { preloadedScript, siteConfig } from "@/lib/site";
import "./globals.css";

// UI/body: soft geometric sans. Display: Bricolage Grotesque (variable wght + opsz + wdth: headings condense and
// sharpen as they grow). Accent: Instrument Serif italic for the odd *highlighted* word. Mono: indices and counters.
// All SIL OFL 1.1 via Google Fonts, self-hosted at build time by next/font.
const sans = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const display = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"], axes: ["opsz", "wdth"], display: "swap" });
// not preloaded: only headings with an *accent* word request it
const accent = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: "italic", display: "swap", preload: false });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const s = await getStoreSettings();
  const name = s?.storeName ?? "Store";
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: name, template: `%s · ${name}` },
    // admin favicon (store_settings.favicon_url) when set; otherwise public/favicon.ico (not app/, whose file convention always wins)
    icons: s?.faviconUrl ? { icon: s.faviconUrl, apple: s.faviconUrl } : { icon: "/favicon.ico" },
    openGraph: { siteName: name, type: "website", locale: "en_IN" },
  };
}

// ponytail: the meta tag needs a literal value; mirrors --canvas in globals.css
export const viewport: Viewport = { themeColor: "#f3f1ec" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: preloadedScript may add data-preloaded to <html> before hydration
    <html lang="en" className={`${sans.variable} ${display.variable} ${accent.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        {/* before any markup paints: hides the store preloader for the rest of the session */}
        <script dangerouslySetInnerHTML={{ __html: preloadedScript }} />
        <SmoothScroll />
        {/* "user": Framer skips transform/layout animation for prefers-reduced-motion (opacity fades stay) */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
