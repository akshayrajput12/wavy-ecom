import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { site } from "@/data/site";
import "./globals.css";

const sans = Instrument_Sans({ variable: "--font-instrument-sans", subsets: ["latin"], display: "swap" });
const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website", locale: "en_IN" },
};

// ponytail: the meta tag needs a literal value; mirrors --canvas in globals.css
export const viewport: Viewport = { themeColor: "#fcfaf7" };

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
