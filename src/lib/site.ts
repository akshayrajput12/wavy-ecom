/** Deployment-level constants only. Store name, support contacts, thresholds etc. live in store_settings (DB). */
export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "INR",
  locale: "en-IN",
} as const;
