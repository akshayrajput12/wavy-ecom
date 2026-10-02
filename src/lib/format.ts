import { siteConfig as site } from "@/lib/site";

/** All money is stored as integer paise. Format for display only. */
const inr = new Intl.NumberFormat(site.locale, { style: "currency", currency: site.currency, maximumFractionDigits: 0 });
export const formatPrice = (paise: number) => inr.format(paise / 100);

const dt = new Intl.DateTimeFormat(site.locale, { day: "numeric", month: "short", year: "numeric" });
export const formatDate = (d: string | Date) => dt.format(new Date(d));

/** Invoices: paise as rupees with 2 decimals and lakh grouping, no symbol (headers say INR). */
const amt = new Intl.NumberFormat(site.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatAmount = (paise: number) => amt.format(paise / 100);
/** Legal dates (invoices) are IST whatever the server timezone is. */
const istDate = new Intl.DateTimeFormat(site.locale, { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
export const formatDateIST = (d: string | Date) => istDate.format(new Date(d));

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export type AccentSegment = { text: string; accent: boolean };
/**
 * Heading accent markup: admin text marks a highlighted phrase with asterisks ("Wear your *heritage*.").
 * Returns the heading's words, each as segments flagged `accent` (rendered as <em>, styled in globals.css), so
 * punctuation stays glued to its word. Unmatched asterisks stay literal.
 */
export function accentWords(text: string): AccentSegment[][] {
  const words: AccentSegment[][] = [];
  let word: AccentSegment[] = [];
  text.split(/\*([^*]+)\*/).forEach((part, i) => {
    for (const piece of part.split(/(\s+)/)) {
      if (!piece) continue;
      if (/^\s/.test(piece)) {
        if (word.length) words.push(word);
        word = [];
      } else word.push({ text: piece, accent: i % 2 === 1 });
    }
  });
  if (word.length) words.push(word);
  return words;
}
/** Heading text without accent markers, for aria-labels and other plain-text uses. */
export const plainText = (text: string) => text.replace(/\*([^*]+)\*/g, "$1");
