import { z } from "zod";
import { parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { BULK_INVOICE_LIMIT, bulkInvoicesPdf, pdfResponse } from "@/backend/invoices/service";

const Body = z.union([
  z.object({ orderIds: z.array(z.uuid()).min(1).max(BULK_INVOICE_LIMIT) }),
  z.object({ from: z.iso.datetime({ offset: true }), to: z.iso.datetime({ offset: true }) }),
]);

/**
 * POST /api/admin/invoices {orderIds} | {from, to} (issued_at range) -> ONE PDF, one invoice per page,
 * max 200. Header x-invoices-skipped = selected orders without an invoice yet. orders.read.
 */
export const POST = route("admin.invoices", async ({ req, log }) => {
  const actor = await guard("orders.read");
  const input = await parse(req, Body);
  const { pdf, count, skipped } = await bulkInvoicesPdf(input);
  log.info("invoice.download", { actor: "staff", userId: actor.userId, bulk: true, count, skipped });
  const stamp = new Date().toISOString().slice(0, 10);
  return pdfResponse(pdf, `invoices-${stamp}.pdf`, { "x-invoices-count": String(count), "x-invoices-skipped": String(skipped) });
});
