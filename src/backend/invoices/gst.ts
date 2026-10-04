/** GST primitives for invoices (pure). Money is integer paise. */

/** GST state codes (statutory, CBIC). 25/28 are retired (merged into 26/37). */
export const GST_STATES: Record<string, string> = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand",
  "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
  "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya",
  "18": "Assam", "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
  "24": "Gujarat", "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman and Nicobar Islands",
  "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh", "97": "Other Territory",
};
const BY_NAME = new Map(Object.entries(GST_STATES).map(([code, name]) => [name.toLowerCase(), code]));

/** "Maharashtra" -> "27" (case-insensitive; "&" accepted for "and"). Undefined when unknown. */
export const stateCodeOf = (state: string | undefined) =>
  state ? BY_NAME.get(state.trim().toLowerCase().replace(/\s*&\s*/g, " and ").replace(/\s+/g, " ")) : undefined;

/** First two GSTIN digits are the registration state. */
export const gstinStateCode = (gstin: string | undefined) => (gstin && GST_STATES[gstin.slice(0, 2)] ? gstin.slice(0, 2) : undefined);

/**
 * Split `total` across `weights` proportionally so the parts sum to `total` exactly (largest remainder;
 * ties go to the earlier line). All-zero weights put everything on the first part.
 */
export function allocate(total: number, weights: number[]): number[] {
  if (!weights.length) return [];
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map((_, i) => (i === 0 ? total : 0));
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => [r - out[i], i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let k = 0; left > 0; k++, left--) out[order[k % order.length][1]] += 1;
  return out;
}

/** Intra-state: CGST + SGST halves (an odd paisa goes to SGST, same as the admin tax preview). Inter-state: IGST. */
export function splitTax(tax: number, interState: boolean) {
  if (interState) return { cgst: 0, sgst: 0, igst: tax };
  const cgst = Math.floor(tax / 2);
  return { cgst, sgst: tax - cgst, igst: 0 };
}

/** Invoice series; the DB appends the zero-padded per-FY sequence (issue_invoice, 0021_invoices.sql). */
export const INVOICE_SERIES = "WVY";
const IST_OFFSET_MS = 5.5 * 3_600_000;

/** Indian financial year (April-March, IST) of a moment: 2026-04-01 IST -> "2026-27". */
export function financialYear(at: Date): string {
  const ist = new Date(at.getTime() + IST_OFFSET_MS);
  const start = ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** "WVY/2026-27/" -> numbers like WVY/2026-27/000123. */
export const invoicePrefix = (at: Date) => `${INVOICE_SERIES}/${financialYear(at)}/`;
