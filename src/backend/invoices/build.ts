/**
 * Order snapshot -> invoice body (pure). Nothing is re-priced: the order's own
 * tax_total (from compute_pricing at checkout) is allocated across the lines, so every column sums back
 * to exactly what the customer paid.
 */
import type { Address, Invoice, InvoiceLine, InvoiceParty, PaymentProvider } from "@/types/domain";
import { allocate, GST_STATES, gstinStateCode, splitTax, stateCodeOf } from "./gst";
import { amountInWords } from "./words";

export interface InvoiceSource {
  order: {
    number: string; placedAt: string; currency: string; customerName: string; email: string; phone: string;
    shippingAddress: Address; billingAddress?: Address;
    discount: number; shipping: number; codFee: number; tax: number; total: number; taxRate: number; taxInclusive: boolean;
    paymentProvider: PaymentProvider;
  };
  items: { name: string; variantTitle: string; sku: string; hsn?: string; unitPrice: number; quantity: number; discount: number; lineTotal: number }[];
  seller: {
    storeName: string; legalName?: string; address?: string; gstin?: string; logoUrl?: string; supportEmail?: string; supportPhone?: string;
  };
  payment?: { method?: string; reference?: string; paidAt?: string };
  /** Labels for the non-product lines (from copy). */
  labels: { shipping: string; codFee: string; sku: string };
}
export type InvoiceDraft = Omit<Invoice, "number" | "issuedAt">;

const party = (a: Address, name: string): InvoiceParty => {
  const code = stateCodeOf(a.state);
  return {
    name, state: a.state, stateCode: code,
    lines: [a.line1, a.line2, a.landmark, `${a.city}, ${a.state} ${a.postalCode}`.trim()].filter((l): l is string => !!l),
  };
};

export function buildInvoice(src: InvoiceSource): InvoiceDraft {
  const { order: o, seller: s } = src;
  const sellerCode = gstinStateCode(s.gstin);
  const shipTo = party(o.shippingAddress, o.shippingAddress.name || o.customerName);
  const bill = o.billingAddress ?? o.shippingAddress;
  const billTo = { ...party(bill, bill.name || o.customerName), email: o.email, phone: o.phone };
  // B2C goods: place of supply = where the movement ends (ship-to state). Unknown state code -> intra-state.
  const interState = !!sellerCode && !!shipTo.stateCode && sellerCode !== shipTo.stateCode;

  const rows: Omit<InvoiceLine, "taxable" | "cgst" | "sgst" | "igst" | "total">[] = [
    ...src.items.map((i) => ({
      kind: "item" as const, description: i.name, hsn: i.hsn, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount,
      detail: [i.variantTitle && i.variantTitle !== "Default" ? i.variantTitle : "", `${src.labels.sku} ${i.sku}`].filter(Boolean).join(" · "),
    })),
    ...(o.shipping > 0 ? [{ kind: "shipping" as const, description: src.labels.shipping, quantity: 1, unitPrice: o.shipping, discount: 0 }] : []),
    ...(o.codFee > 0 ? [{ kind: "cod_fee" as const, description: src.labels.codFee, quantity: 1, unitPrice: o.codFee, discount: 0 }] : []),
  ];
  const amounts = [...src.items.map((i) => i.lineTotal), ...rows.slice(src.items.length).map((r) => r.unitPrice)];
  const taxes = allocate(o.tax, amounts);
  const lines: InvoiceLine[] = rows.map((r, i) => {
    const taxable = o.taxInclusive ? amounts[i] - taxes[i] : amounts[i];
    return { ...r, taxable, ...splitTax(taxes[i], interState), total: taxable + taxes[i] };
  });

  const sum = (k: "discount" | "taxable" | "cgst" | "sgst" | "igst" | "total") => lines.reduce((n, l) => n + l[k], 0);
  const lineTotal = sum("total");
  const totals = {
    discount: sum("discount"), taxable: sum("taxable"), cgst: sum("cgst"), sgst: sum("sgst"), igst: sum("igst"), tax: o.tax,
    roundOff: o.total - lineTotal, // 0 unless the stored order is inconsistent; shown so the invoice still reconciles
    total: o.total,
  };

  return {
    orderNumber: o.number, orderDate: o.placedAt, currency: o.currency,
    seller: {
      name: s.legalName || s.storeName, storeName: s.storeName, lines: (s.address ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean),
      gstin: s.gstin, stateCode: sellerCode, state: sellerCode ? GST_STATES[sellerCode] : undefined,
      logoUrl: s.logoUrl, supportEmail: s.supportEmail, supportPhone: s.supportPhone,
    },
    billTo, shipTo,
    placeOfSupply: { state: o.shippingAddress.state, code: shipTo.stateCode },
    interState, taxRate: o.taxRate, taxInclusive: o.taxInclusive, lines, totals, amountInWords: amountInWords(o.total),
    payment: {
      provider: o.paymentProvider, status: o.total === 0 ? "none" : o.paymentProvider === "cod" ? "cod" : "paid",
      method: src.payment?.method, reference: src.payment?.reference, paidAt: src.payment?.paidAt,
    },
  };
}
