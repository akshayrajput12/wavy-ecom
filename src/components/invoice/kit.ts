import type { ComponentType, ReactNode } from "react";

/**
 * The invoice layout is written once (InvoiceDocument) against these semantic roles. Each target maps
 * the roles to its own primitives: DomKit (divs + Tailwind tokens, on screen) and the react-pdf kit
 * (src/backend/invoices/pdf.tsx). Same structure, same proportions, so the PDF matches the screen.
 */
export type BoxRole =
  | "page" | "band" | "head" | "brand" | "titleBlock" | "parties" | "party" | "metaRow"
  | "table" | "thead" | "row" | "cell" | "summary" | "words" | "totals" | "totalRow" | "grand" | "foot";
export type TextRole =
  | "wordmark" | "overline" | "title" | "number" | "strong" | "body" | "muted"
  | "th" | "td" | "tdNum" | "tdIndex" | "grandLabel" | "grandValue";

export interface InvoiceKit {
  /** `w` = width in % of the parent row (table columns); `right` = right-aligned content. */
  Box: ComponentType<{ s: BoxRole; w?: number; right?: boolean; children?: ReactNode }>;
  Text: ComponentType<{ s: TextRole; right?: boolean; children?: ReactNode }>;
  Logo: ComponentType<{ src: string; alt: string }>;
}
