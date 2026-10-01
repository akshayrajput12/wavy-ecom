import { describe, expect, it } from "vitest";
import type { Address } from "@/types/domain";
import { buildInvoice, type InvoiceSource } from "./build";
import { allocate, financialYear, invoicePrefix, splitTax, stateCodeOf } from "./gst";
import { GUEST_LINK_TTL_S, signGuestToken, verifyGuestToken } from "./guest-token";
import { amountInWords, numberInWords } from "./words";

describe("amount in words (Indian numbering)", () => {
  it("uses thousand / lakh / crore groupings", () => {
    expect(numberInWords(0)).toBe("Zero");
    expect(numberInWords(15)).toBe("Fifteen");
    expect(numberInWords(101)).toBe("One Hundred One");
    expect(numberInWords(1_00_000)).toBe("One Lakh");
    expect(numberInWords(12_34_567)).toBe("Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven");
    expect(numberInWords(1_23_45_678)).toBe("One Crore Twenty-Three Lakh Forty-Five Thousand Six Hundred Seventy-Eight");
    expect(numberInWords(100_00_00_000)).toBe("One Hundred Crore");
  });
  it("formats rupees and paise from integer paise", () => {
    expect(amountInWords(123456)).toBe("Indian Rupees One Thousand Two Hundred Thirty-Four and Fifty-Six Paise Only");
    expect(amountInWords(50_000_00)).toBe("Indian Rupees Fifty Thousand Only");
    expect(amountInWords(5)).toBe("Indian Rupees Zero and Five Paise Only");
  });
});

describe("tax split and rounding", () => {
  it("allocates exactly, largest remainder first", () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(7, [0, 0])).toEqual([7, 0]);
    const parts = allocate(12_857, [99_900, 49_900, 9_900, 4_900]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(12_857);
  });
  it("halves CGST/SGST intra-state with the odd paisa on SGST, IGST inter-state", () => {
    expect(splitTax(1071, false)).toEqual({ cgst: 535, sgst: 536, igst: 0 });
    expect(splitTax(1071, true)).toEqual({ cgst: 0, sgst: 0, igst: 1071 });
  });
  it("maps state names to GST codes", () => {
    expect(stateCodeOf("Maharashtra")).toBe("27");
    expect(stateCodeOf(" jammu & kashmir ")).toBe("01");
    expect(stateCodeOf("Atlantis")).toBeUndefined();
  });
});

const addr = (state: string): Address => ({ name: "Asha Rao", phone: "9999999999", line1: "12 MG Road", city: "City", state, postalCode: "400001", country: "IN" });
const source = (state: string, inclusive = true): InvoiceSource => ({
  order: {
    number: "wavy-100001", placedAt: "2026-10-01T10:00:00Z", currency: "INR", customerName: "Asha Rao", email: "a@x.in", phone: "9999999999",
    shippingAddress: addr(state), discount: 10_000, shipping: 9_900, codFee: 0, tax: 0, total: 0, taxRate: 12, taxInclusive: inclusive,
    paymentProvider: "razorpay",
  },
  items: [
    { name: "Tee", variantTitle: "Black / M", sku: "TEE-BM", hsn: "6109", unitPrice: 99_900, quantity: 2, discount: 10_000, lineTotal: 189_800 },
    { name: "Cap", variantTitle: "Default", sku: "CAP", hsn: "6505", unitPrice: 49_900, quantity: 1, discount: 0, lineTotal: 49_900 },
  ],
  seller: { storeName: "wavy", legalName: "Wavy Retail Pvt Ltd", address: "1 Studio Lane\nMumbai 400001", gstin: "27ABCDE1234F1Z5" },
  payment: { method: "upi", reference: "pay_123" },
  labels: { shipping: "Shipping", codFee: "Cash handling fee", sku: "SKU" },
});
const withTotals = (s: InvoiceSource) => {
  // mirror compute_pricing: tax on (net + shipping + cod), inclusive -> contained in price
  const taxable = 189_800 + 49_900 + s.order.shipping + s.order.codFee;
  const tax = s.order.taxInclusive ? Math.round(taxable - taxable / 1.12) : Math.round(taxable * 0.12);
  return { ...s, order: { ...s.order, tax, total: taxable + (s.order.taxInclusive ? 0 : tax) } };
};

describe("buildInvoice", () => {
  it("intra-state: CGST + SGST that reconcile to the order exactly", () => {
    const src = withTotals(source("Maharashtra"));
    const inv = buildInvoice(src);
    expect(inv.interState).toBe(false);
    expect(inv.placeOfSupply).toEqual({ state: "Maharashtra", code: "27" });
    expect(inv.lines.map((l) => l.kind)).toEqual(["item", "item", "shipping"]);
    expect(inv.totals.igst).toBe(0);
    expect(inv.totals.cgst + inv.totals.sgst).toBe(src.order.tax);
    expect(inv.totals.taxable + inv.totals.tax).toBe(src.order.total);
    expect(inv.totals.roundOff).toBe(0);
    for (const l of inv.lines) expect(l.taxable + l.cgst + l.sgst).toBe(l.total);
    expect(inv.lines[0].detail).toBe("Black / M · SKU TEE-BM");
  });
  it("inter-state: IGST only; exclusive pricing adds tax on top", () => {
    const src = withTotals(source("Karnataka", false));
    const inv = buildInvoice(src);
    expect(inv.interState).toBe(true);
    expect(inv.totals.cgst + inv.totals.sgst).toBe(0);
    expect(inv.totals.igst).toBe(src.order.tax);
    expect(inv.totals.taxable).toBe(189_800 + 49_900 + 9_900);
    expect(inv.totals.total).toBe(src.order.total);
    expect(inv.amountInWords).toMatch(/^Indian Rupees .* Only$/);
  });
});

describe("invoice numbering", () => {
  it("rolls the financial year over on 1 April IST", () => {
    expect(financialYear(new Date("2027-03-31T18:29:59Z"))).toBe("2026-27"); // 31 Mar 23:59:59 IST
    expect(financialYear(new Date("2027-03-31T18:30:00Z"))).toBe("2027-28"); // 1 Apr 00:00 IST
    expect(financialYear(new Date("2099-12-31T00:00:00Z"))).toBe("2099-00");
    expect(invoicePrefix(new Date("2026-10-01T00:00:00Z"))).toBe("WVY/2026-27/");
  });
});

describe("guest invoice link", () => {
  const key = Buffer.alloc(32, 7);
  const now = Date.UTC(2026, 9, 1);
  it("accepts only an unexpired token for the same order", () => {
    const t = signGuestToken(key, "order-a", now);
    expect(verifyGuestToken(key, "order-a", t, now)).toBe(true);
    expect(verifyGuestToken(key, "order-b", t, now)).toBe(false);
    expect(verifyGuestToken(Buffer.alloc(32, 8), "order-a", t, now)).toBe(false);
    expect(verifyGuestToken(key, "order-a", t, now + (GUEST_LINK_TTL_S + 1) * 1000)).toBe(false);
  });
  it("refuses a missing, malformed or tampered proof", () => {
    const t = signGuestToken(key, "order-a", now);
    expect(verifyGuestToken(key, "order-a", undefined, now)).toBe(false);
    expect(verifyGuestToken(key, "order-a", "order-a", now)).toBe(false);
    const [exp, sig] = t.split(".");
    expect(verifyGuestToken(key, "order-a", `${Number(exp) + 60}.${sig}`, now)).toBe(false);
  });
});
