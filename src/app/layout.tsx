import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { MotionConfig } from "framer-motion";
import { Toaster } from "sonner";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { getStoreSettings } from "@/backend/settings/repo";
import { preloadedScript, siteConfig } from "@/lib/site";
import "./globals.css";

// UI/body: soft geometric sans. Display: Bricolage Grotesque (variable wght + opsz + wdth: headings condense and
// sharpen as they grow). Accent: Instrument Serif italic for the odd *highlighted* word. Mono: indices and counters.
// All SIL OFL 1.1 fonts self-hosted locally in ./fonts so `next dev` / `next build` never depend on network fetches.
const sans = localFont({
  src: "./fonts/PlusJakartaSans-Variable.woff2",
  variable: "--font-jakarta",
  weight: "200 800",
  style: "normal",
  display: "swap",
});
const display = localFont({
  src: "./fonts/BricolageGrotesque-Variable.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  style: "normal",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "75% 100%" }],
});
// not preloaded: only headings with an *accent* word request it
const accent = localFont({
  src: "./fonts/InstrumentSerif-Italic.woff2",
  variable: "--font-instrument",
  weight: "400",
  style: "italic",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});
const mono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

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
