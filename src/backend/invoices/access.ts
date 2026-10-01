import "server-only";
import { requireUser } from "@/backend/_core/auth";
import { must, serviceDb, userDb } from "@/backend/_core/db";
import { ApiError } from "@/backend/_core/http";
import { logger } from "@/lib/logger";
import type { Invoice } from "@/types/domain";
import { GUEST_WINDOW_MS, guestLinkKey, signGuestToken, verifyGuestToken } from "./guest-token";
import { invoiceIfReady } from "./service";

const log = logger.child({ svc: "invoices.access" });

export type GuestInvoiceOffer =
  | { state: "ready"; invoice: Invoice; href: string }
  | { state: "pending_payment" | "on_dispatch" };

/**
 * Checkout success page, signed-out viewer. The proof is the same one the page already uses: the order's
 * unguessable tracking token from the success URL. Offered only for a short window after placement; the
 * download link is HMAC-signed for this order and expires (GUEST_LINK_TTL_S). Null = no access.
 */
export async function guestInvoiceOffer(orderNumber: string, trackingToken: string | undefined): Promise<GuestInvoiceOffer | null> {
  if (!trackingToken || trackingToken.length < 32) return null;
  const o = must<{ id: string; tracking_token: string; placed_at: string; payment_provider: string } | null>(
    await serviceDb().from("orders").select("id, tracking_token, placed_at, payment_provider").eq("order_number", orderNumber).maybeSingle(),
    "load the order",
  );
  if (!o || o.tracking_token !== trackingToken || Date.now() - Date.parse(o.placed_at) > GUEST_WINDOW_MS) return null;
  const key = guestLinkKey();
  if (!key) { log.warn("invoice.guest_link_unconfigured", { orderId: o.id }); return null; }
  const invoice = await invoiceIfReady(o.id);
  if (!invoice) return { state: o.payment_provider === "cod" ? "on_dispatch" : "pending_payment" };
  const href = `/api/orders/${encodeURIComponent(orderNumber)}/invoice?t=${encodeURIComponent(signGuestToken(key, o.id))}`;
  return { state: "ready", invoice, href };
}

/**
 * GET /api/orders/:number/invoice gate. `t` (guest link) must verify for this exact order; otherwise the
 * signed-in owner (RLS read). Unknown / not yours / bad proof all look the same (404) so ids can't be probed.
 */
export async function authorizeInvoiceDownload(orderNumber: string, guestToken: string | null): Promise<{ orderId: string; actor: "guest" | "customer"; userId?: string }> {
  const notFound = new ApiError(404, "invoice_not_found", "Invoice not found");
  if (guestToken) {
    const key = guestLinkKey();
    const o = key && must<{ id: string } | null>(
      await serviceDb().from("orders").select("id").eq("order_number", orderNumber).maybeSingle(), "load the order",
    );
    if (!key || !o) throw notFound;
    if (!verifyGuestToken(key, o.id, guestToken)) throw new ApiError(403, "invoice_link_expired", "This invoice link has expired");
    return { orderId: o.id, actor: "guest" };
  }
  const session = await requireUser();
  const o = must<{ id: string } | null>(
    await (await userDb()).from("orders").select("id").eq("order_number", orderNumber).eq("user_id", session.userId).maybeSingle(),
    "load your order",
  );
  if (!o) throw notFound;
  return { orderId: o.id, actor: "customer", userId: session.userId };
}
