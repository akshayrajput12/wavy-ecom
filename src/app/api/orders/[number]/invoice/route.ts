import { z } from "zod";
import { route } from "@/backend/_core/http";
import { authorizeInvoiceDownload } from "@/backend/invoices/access";
import { getInvoicePdf, pdfResponse } from "@/backend/invoices/service";

const Query = z.object({ t: z.string().max(80).optional() });

/**
 * GET /api/orders/:number/invoice -> application/pdf. Signed-in owner, or a guest holding the short-lived
 * signed link (`?t=`) minted by the checkout success page. Issues the invoice on first request if the
 * order qualifies (409 invoice_not_ready otherwise).
 */
export const GET = route<{ number: string }>("orders.invoice", async ({ req, params, log }) => {
  const { t } = Query.parse({ t: req.nextUrl.searchParams.get("t") ?? undefined });
  const who = await authorizeInvoiceDownload(params.number, t ?? null);
  const { pdf, number, filename } = await getInvoicePdf(who.orderId);
  log.info("invoice.download", { orderId: who.orderId, invoiceNumber: number, actor: who.actor, userId: who.userId });
  return pdfResponse(pdf, filename);
});
