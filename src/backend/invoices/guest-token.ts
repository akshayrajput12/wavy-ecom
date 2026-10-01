/**
 * Short-lived guest invoice link: `<expUnixSeconds>.<hmac>` bound to one order id. Minted only by the checkout
 * success page after it has verified the order's tracking token, so the order id alone never grants access.
 * Pure (key passed in); covered by invoice.test.ts.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** How long a minted download link works. */
export const GUEST_LINK_TTL_S = 30 * 60;
/** Guests can open the invoice only this long after placing the order (then: sign in / support). */
export const GUEST_WINDOW_MS = 2 * 3_600_000;

const mac = (key: Buffer, orderId: string, exp: number) =>
  createHmac("sha256", key).update(`invoice:${orderId}:${exp}`).digest("base64url");

export function signGuestToken(key: Buffer, orderId: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + GUEST_LINK_TTL_S;
  return `${exp}.${mac(key, orderId, exp)}`;
}

/** True only for an unexpired token minted for this exact order. */
export function verifyGuestToken(key: Buffer, orderId: string, token: string | null | undefined, now = Date.now()): boolean {
  const m = /^(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(token ?? "");
  if (!m) return false;
  const exp = Number(m[1]);
  const nowS = Math.floor(now / 1000);
  if (exp <= nowS || exp > nowS + GUEST_LINK_TTL_S) return false;
  const a = Buffer.from(m[2]), b = Buffer.from(mac(key, orderId, exp));
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Link key: INVOICE_LINK_SECRET, else derived from the service-role key (domain-separated). Null when neither is set. */
export function guestLinkKey(env: Record<string, string | undefined> = process.env): Buffer | null {
  const base = env.INVOICE_LINK_SECRET || env.SUPABASE_SERVICE_ROLE_KEY;
  return base ? createHmac("sha256", base).update("wavy.invoice-link.v1").digest() : null;
}
