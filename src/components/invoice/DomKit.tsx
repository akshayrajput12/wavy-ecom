import { clsx } from "clsx";
import { BrandImage } from "@/components/layout/Logo";
import type { BoxRole, InvoiceKit, TextRole } from "./kit";

/**
 * On-screen invoice primitives (tokens only). A fixed 840px sheet, so proportions match the A4 PDF
 * (backend/invoices/pdf.tsx scales these sizes by ~0.71 px -> pt); the modal scrolls it sideways on phones.
 */
const box: Record<BoxRole, string> = {
  page: "w-[840px] overflow-hidden rounded-md border border-line bg-surface px-12 pb-10 font-sans text-ink shadow-sm",
  band: "-mx-12 mb-9 h-1.5 bg-ink",
  head: "flex items-start justify-between gap-8 border-b border-ink pb-6",
  brand: "flex max-w-[58%] flex-col gap-0.5",
  titleBlock: "flex flex-col items-end gap-1",
  parties: "flex gap-6 border-b border-line py-6",
  party: "flex flex-1 flex-col gap-0.5",
  metaRow: "flex justify-between gap-3",
  table: "mt-6 flex flex-col",
  thead: "flex border-y border-ink py-2",
  row: "flex border-b border-line-soft py-2.5",
  cell: "flex flex-col px-1",
  summary: "mt-6 flex items-start justify-between gap-10",
  words: "flex max-w-[52%] flex-col gap-1",
  totals: "flex w-[40%] flex-col gap-1.5",
  totalRow: "flex justify-between gap-4",
  grand: "mt-2 flex items-baseline justify-between gap-4 rounded-sm bg-accent px-3 py-2.5",
  foot: "mt-10 flex justify-between gap-6 border-t border-line pt-4",
};
const text: Record<TextRole, string> = {
  wordmark: "mb-2 font-display text-h2 font-bold leading-tight tracking-tight",
  overline: "mb-1.5 text-overline font-semibold uppercase tracking-(--tracking-wide) text-ink-soft",
  title: "font-display text-h1 leading-none font-semibold tracking-(--tracking-display)",
  number: "font-mono text-body font-medium",
  strong: "text-meta font-semibold",
  body: "text-meta",
  muted: "text-micro text-ink-soft",
  th: "whitespace-nowrap text-overline font-semibold uppercase tracking-wide text-ink-soft",
  td: "text-meta font-medium",
  tdNum: "font-mono text-overline tabular-nums",
  tdIndex: "font-mono text-overline text-ink-muted",
  grandLabel: "font-display text-body-lg font-semibold",
  grandValue: "font-mono text-h3 font-medium tabular-nums",
};

export const domKit: InvoiceKit = {
  Box: ({ s, w, right, children }) => (
    <div className={clsx(box[s], right && "items-end text-right")} style={w ? { width: `${w}%` } : undefined}>{children}</div>
  ),
  Text: ({ s, right, children }) => <span className={clsx("block", text[s], right && "text-right")}>{children}</span>,
  Logo: ({ src, alt }) => <BrandImage src={src} alt={alt} className="mb-2 h-10" />,
};
