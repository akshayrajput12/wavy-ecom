import "server-only";
import { after } from "next/server";
import { ApiError } from "@/backend/_core/http";
import { logger, type Logger } from "@/lib/logger";
import type { Invoice } from "@/types/domain";
import { buildInvoice } from "./build";
import { invoicePrefix } from "./gst";
import { renderInvoicesPdf } from "./pdf";
import {
  findInvoice, findInvoices, invoicesIssuedBetween, issueInvoiceRow, loadInvoiceContext, readPdf, storePdf, toInvoice, type InvoiceRow,
} from "./repo";

const log = logger.child({ svc: "invoices" });
/** Bulk download cap (one combined PDF). */
export const BULK_INVOICE_LIMIT = 200;

/**
 * The order's invoice, issuing it now if the order qualifies (paid; COD once dispatched). Idempotent and
 * safe under concurrent webhook retries: issue_invoice locks the order and returns the existing row.
 * Throws 409 invoice_not_ready when the order doesn't qualify yet.
 */
export async function ensureInvoice(orderId: string): Promise<InvoiceRow> {
  const ctx = await loadInvoiceContext(orderId); // 1 round trip: existing invoice + eligibility + source
  if (!ctx) throw new ApiError(404, "order_not_found", "Order not found");
  if (ctx.existing) return ctx.existing;
  if (!ctx.eligible) throw new ApiError(409, "invoice_not_ready", "This order has no invoice yet");
  const row = await issueInvoiceRow(orderId, invoicePrefix(new Date()), buildInvoice(ctx.source));
  log.info("invoice.issued", { orderId, invoiceNumber: row.invoice_number, total: ctx.source.order.total });
  return row;
}

/** Fire-and-forget hook after payment capture / dispatch: never breaks the caller's flow. */
export async function issueInvoiceIfEligible(orderId: string, from: string, l: Logger = log): Promise<InvoiceRow | null> {
  try {
    return await ensureInvoice(orderId);
  } catch (e) {
    if (e instanceof ApiError && e.code === "invoice_not_ready") return null;
    l.warn("invoice.issue_failed", { orderId, from, reason: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

/** Like ensureInvoice but returns null instead of 409 when not issuable yet (pages that just show a button). */
export async function invoiceIfReady(orderId: string): Promise<Invoice | null> {
  const row = await issueInvoiceIfEligible(orderId, "view");
  return row && toInvoice(row);
}

/** The stored PDF (rendered + cached on first use). Email-ready: attach `pdf` as `${filename}`. */
export async function getInvoicePdf(orderId: string): Promise<{ pdf: Buffer; number: string; filename: string }> {
  const row = await ensureInvoice(orderId);
  const cached = row.pdf_path ? await readPdf(row.pdf_path) : null;
  const pdf = cached ?? (await renderAndStore(row));
  return { pdf, number: row.invoice_number, filename: invoiceFilename(row.invoice_number) };
}

/** Staff "Regenerate PDF": same number and snapshot, fresh render (e.g. after a renderer or logo-file fix). */
export async function regenerateInvoicePdf(orderId: string) {
  const row = await findInvoice(orderId);
  if (!row) throw new ApiError(409, "invoice_not_ready", "This order has no invoice yet");
  await renderAndStore(row, true);
  log.info("invoice.regenerated", { orderId, invoiceNumber: row.invoice_number });
  return { number: row.invoice_number };
}

/**
 * Renders the PDF. `strict` (staff regenerate) stores it before returning; otherwise the storage upload + row update
 * run after the response, so a first download doesn't wait two more round trips for the cache write.
 * ponytail: after() needs a request scope (route handlers today); an email job calling getInvoicePdf would pass strict.
 */
async function renderAndStore(row: InvoiceRow, strict = false): Promise<Buffer> {
  const pdf = await renderInvoicesPdf([toInvoice(row)]);
  if (strict) await storePdf(row, pdf);
  else after(() => storePdf(row, pdf).catch((e: unknown) => {
    log.warn("invoice.pdf_cache_failed", { orderId: row.order_id, reason: e instanceof Error ? e.message : String(e) });
  }));
  return pdf;
}

/** Admin bulk: one PDF, one invoice per page. Orders without an issuable invoice are skipped and counted. */
export async function bulkInvoicesPdf(input: { orderIds: string[] } | { from: string; to: string }) {
  let rows: InvoiceRow[];
  let skipped = 0;
  if ("orderIds" in input) {
    const ids = [...new Set(input.orderIds)];
    const have = await findInvoices(ids);
    const missing = ids.filter((id) => !have.some((r) => r.order_id === id));
    const issued = (await Promise.all(missing.map((id) => issueInvoiceIfEligible(id, "bulk")))).filter((r): r is InvoiceRow => !!r);
    rows = [...have, ...issued];
    skipped = ids.length - rows.length;
  } else {
    const { rows: found, count } = await invoicesIssuedBetween(input.from, input.to, BULK_INVOICE_LIMIT);
    if (count > BULK_INVOICE_LIMIT) {
      throw new ApiError(422, "too_many_invoices", `${count} invoices in this range; narrow it to ${BULK_INVOICE_LIMIT} or fewer`, { count });
    }
    rows = found;
  }
  if (!rows.length) throw new ApiError(404, "no_invoices", "None of these orders has an invoice yet");
  rows.sort((a, b) => a.invoice_number.localeCompare(b.invoice_number));
  return { pdf: await renderInvoicesPdf(rows.map(toInvoice)), count: rows.length, skipped };
}

export const invoiceFilename = (number: string) => `invoice-${number.replace(/\//g, "-")}.pdf`;

/** HTTP response for a PDF download (never cached by shared caches). */
export function pdfResponse(pdf: Buffer, filename: string, headers: Record<string, string> = {}) {
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf", "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store", "x-content-type-options": "nosniff", ...headers,
    },
  });
}
