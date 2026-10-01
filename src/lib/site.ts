/** Deployment-level constants only. Store name, support contacts, thresholds etc. live in store_settings (DB). */
export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "INR",
  locale: "en-IN",
} as const;

/**
 * sessionStorage flag: the storefront preloader already played this session. The root layout's inline script
 * reads it before first paint and sets `<html data-preloaded>`, which hides the server-rendered cover (globals.css).
 */
export const PRELOADED_KEY = "wavy.preloaded";
export const preloadedScript = `try{if(sessionStorage.getItem(${JSON.stringify(PRELOADED_KEY)}))document.documentElement.setAttribute("data-preloaded","")}catch(e){}`;
