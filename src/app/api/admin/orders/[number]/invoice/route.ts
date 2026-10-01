import { ok, route } from "@/backend/_core/http";
import { audit, guard } from "@/backend/admin/_shared";
import { orderByNumber } from "@/backend/admin/orders";
import { getInvoicePdf, pdfResponse, regenerateInvoicePdf } from "@/backend/invoices/service";

type P = { number: string };

/** GET -> the order's invoice PDF (orders.read). Issues it on first request if the order qualifies. */
export const GET = route<P>("admin.invoices", async ({ params, log }) => {
  const actor = await guard("orders.read");
  const o = await orderByNumber(params.number);
  const { pdf, number, filename } = await getInvoicePdf(o.id);
  log.info("invoice.download", { orderId: o.id, invoiceNumber: number, actor: "staff", userId: actor.userId });
  return pdfResponse(pdf, filename);
});

/** POST -> re-render the stored PDF from the frozen snapshot, same number (orders.write). */
export const POST = route<P>("admin.invoices", async ({ params }) => {
  const actor = await guard("orders.write");
  const o = await orderByNumber(params.number);
  const res = await regenerateInvoicePdf(o.id);
  await audit(actor, "invoice.regenerate", "orders", o.id, null, res);
  return ok(res);
});
