/** Brand + global site copy. Every page reads brand text from here. */
export const site = {
  name: "wavy",
  tagline: "Clothing & Sneakers",
  description: "wavy — premium clothing and sneakers, designed in India.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "INR",
  locale: "en-IN",
  supportEmail: "support@wavy.store",
  social: { instagram: "https://instagram.com/", youtube: "https://youtube.com/" },
} as const;
