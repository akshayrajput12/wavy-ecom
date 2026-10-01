import "server-only";
import { must, serviceDb } from "@/backend/_core/db";
import { toAddress } from "@/backend/orders/mapper";
import { invoiceCopy } from "@/data/copy";
import type { Invoice, PaymentProvider } from "@/types/domain";
import type { InvoiceDraft, InvoiceSource } from "./build";

const BUCKET = "invoices";
const COLS = "id, order_id, invoice_number, issued_at, snapshot, pdf_path";
export interface InvoiceRow { id: string; order_id: string; invoice_number: string; issued_at: string; snapshot: InvoiceDraft; pdf_path: string | null }

export const toInvoice = (r: InvoiceRow): Invoice => ({ ...r.snapshot, number: r.invoice_number, issuedAt: r.issued_at });

export async function findInvoice(orderId: string): Promise<InvoiceRow | null> {
  return must(await serviceDb().from("invoices").select(COLS).eq("order_id", orderId).maybeSingle(), "load the invoice");
}

export async function findInvoices(orderIds: string[]): Promise<InvoiceRow[]> {
  if (!orderIds.length) return [];
  return must(await serviceDb().from("invoices").select(COLS).in("order_id", orderIds).order("issued_at"), "load invoices");
}

/** Invoices issued in [from, to), oldest first; `count` is the full match count (for the cap message). */
export async function invoicesIssuedBetween(from: string, to: string, limit: number) {
  const res = await serviceDb().from("invoices").select(COLS, { count: "exact" })
    .gte("issued_at", from).lt("issued_at", to).order("issued_at").limit(limit);
  return { rows: must<InvoiceRow[]>(res, "load invoices"), count: res.count ?? 0 };
}

interface OrderSrc {
  order_number: string; placed_at: string; currency: string; customer_name: string; email: string; phone: string;
  shipping_address: unknown; billing_address: unknown; discount_total: number; shipping_total: number; cod_fee: number;
  tax_total: number; total: number; tax_rate: number; tax_inclusive: boolean; payment_provider: PaymentProvider; paid_at: string | null;
  items: { product_name: string; variant_title: string; sku: string; hsn_code: string | null; unit_price: number; quantity: number; discount_allocated: number; line_total: number }[] | null;
  payments: { provider: string; status: string; method: string | null; provider_payment_id: string | null; captured_at: string | null }[] | null;
}
type SettingsSrc = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** Everything buildInvoice needs, read once from the stored order (never re-priced). */
export async function loadInvoiceSource(orderId: string): Promise<InvoiceSource | null> {
  const db = serviceDb();
  const [o, s] = await Promise.all([
    db.from("orders").select(
      "order_number, placed_at, currency, customer_name, email, phone, shipping_address, billing_address, discount_total, shipping_total, cod_fee, " +
      "tax_total, total, tax_rate, tax_inclusive, payment_provider, paid_at, " +
      "items:order_items!order_items_order_id_fkey(product_name, variant_title, sku, hsn_code, unit_price, quantity, discount_allocated, line_total, created_at), " +
      "payments(provider, status, method, provider_payment_id, captured_at)",
    ).eq("id", orderId).order("created_at", { referencedTable: "items" }).maybeSingle(),
    db.from("store_settings").select("*").maybeSingle(), // `*`: tolerates optional columns (logo_url, 0024)
  ]);
  const order = must<OrderSrc | null>(o, "load the order");
  const st = must<SettingsSrc | null>(s, "load store settings") ?? {};
  if (!order) return null;
  const paid = (order.payments ?? []).find((p) => p.provider === order.payment_provider && p.status !== "initiated" && p.status !== "failed");
  return {
    order: {
      number: order.order_number, placedAt: order.placed_at, currency: order.currency, customerName: order.customer_name,
      email: order.email, phone: order.phone, shippingAddress: toAddress(order.shipping_address),
      billingAddress: order.billing_address ? toAddress(order.billing_address) : undefined,
      discount: order.discount_total, shipping: order.shipping_total, codFee: order.cod_fee, tax: order.tax_total, total: order.total,
      taxRate: Number(order.tax_rate), taxInclusive: order.tax_inclusive, paymentProvider: order.payment_provider,
    },
    items: (order.items ?? []).map((i) => ({
      name: i.product_name, variantTitle: i.variant_title, sku: i.sku, hsn: i.hsn_code ?? undefined, unitPrice: i.unit_price,
      quantity: i.quantity, discount: i.discount_allocated, lineTotal: i.line_total,
    })),
    seller: {
      storeName: str(st.store_name) ?? "", legalName: str(st.legal_name), address: str(st.registered_address), gstin: str(st.gst_number),
      logoUrl: str(st.logo_url), supportEmail: str(st.support_email), supportPhone: str(st.support_phone),
    },
    payment: paid && { method: paid.method ?? undefined, reference: paid.provider_payment_id ?? undefined, paidAt: paid.captured_at ?? order.paid_at ?? undefined },
    labels: { shipping: invoiceCopy.shipping, codFee: invoiceCopy.codFee, sku: invoiceCopy.sku },
  };
}

/** issue_invoice RPC: idempotent (existing row returned), gap-free number per FY, refuses ineligible orders (409 invoice_not_ready). */
export async function issueInvoiceRow(orderId: string, prefix: string, draft: InvoiceDraft): Promise<InvoiceRow> {
  const row = must<InvoiceRow>(
    await serviceDb().rpc("issue_invoice", { p_order_id: orderId, p_prefix: prefix, p_snapshot: draft }), "issue the invoice",
  );
  return { ...row, pdf_path: row.pdf_path ?? null };
}

export async function readPdf(path: string): Promise<Buffer | null> {
  const { data, error } = await serviceDb().storage.from(BUCKET).download(path);
  return error || !data ? null : Buffer.from(await data.arrayBuffer());
}

export async function storePdf(row: InvoiceRow, pdf: Buffer): Promise<void> {
  const path = `${row.invoice_number.replace(/\//g, "_")}.pdf`;
  const db = serviceDb();
  const up = await db.storage.from(BUCKET).upload(path, pdf, { contentType: "application/pdf", upsert: true });
  if (up.error) throw up.error;
  must(await db.from("invoices").update({ pdf_path: path, pdf_generated_at: new Date().toISOString() }).eq("id", row.id), "save the invoice PDF");
}
