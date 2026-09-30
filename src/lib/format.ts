import { site } from "@/data/site";

/** All money is stored as integer paise. Format for display only. */
const inr = new Intl.NumberFormat(site.locale, { style: "currency", currency: site.currency, maximumFractionDigits: 0 });
export const formatPrice = (paise: number) => inr.format(paise / 100);

const dt = new Intl.DateTimeFormat(site.locale, { day: "numeric", month: "short", year: "numeric" });
export const formatDate = (d: string | Date) => dt.format(new Date(d));

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
