import "server-only";
import { must, serviceDb } from "@/backend/_core/db";
import { ApiError } from "@/backend/_core/http";
import { logger } from "@/lib/logger";
import type { Json } from "@/types/database";
import { razorpayConfig } from "./providers/razorpay";
import { verifyWebhookSignature } from "./providers/razorpay-crypto";
import { processRazorpayEvent } from "./service";

const log = logger.child({ svc: "payments.webhook", provider: "razorpay" });

/**
 * Razorpay webhook: HMAC check on the raw body, dedupe by provider event id (payment_events UNIQUE),
 * idempotent processing. Duplicates of processed/ignored events return early; failed ones are retried.
 */
export async function handleRazorpayWebhook(rawBody: string, signature: string | null, eventIdHeader: string | null) {
  const { webhookSecret } = razorpayConfig();
  if (!webhookSecret) throw new ApiError(503, "webhook_not_configured", "Webhook secret missing");
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    // not stored: an unsigned event must never claim a real event id
    log.warn("webhook.signature_invalid", { eventId: eventIdHeader });
    throw new ApiError(400, "signature_invalid", "Invalid signature");
  }
  let body: { event?: string; payload?: Record<string, unknown>; created_at?: number };
  try { body = JSON.parse(rawBody); } catch { throw new ApiError(400, "bad_json", "Body must be JSON"); }
  const event = String(body.event ?? "unknown");
  const payload = body.payload ?? {};
  const entity = ((payload.payment as { entity?: Record<string, unknown> } | undefined)?.entity) ?? {};
  const eventId = eventIdHeader ?? `${event}:${String(entity.id ?? body.created_at ?? "")}`;
  const db = serviceDb();

  const inserted = must<{ id: string }[]>(
    await db.from("payment_events").upsert({
      provider: "razorpay", provider_event_id: eventId, event_type: event, source: "webhook", signature_valid: true,
      payload: body as Json, provider_order_id: typeof entity.order_id === "string" ? entity.order_id : null,
      provider_payment_id: typeof entity.id === "string" ? entity.id : null,
    }, { onConflict: "provider,provider_event_id", ignoreDuplicates: true }).select("id"),
    "store the webhook event",
  );
  let rowId = inserted[0]?.id;
  if (!rowId) {
    const existing = must<{ id: string; processing_status: string }>(
      await db.from("payment_events").select("id, processing_status").eq("provider", "razorpay").eq("provider_event_id", eventId).single(),
      "load the webhook event",
    );
    if (existing.processing_status === "processed" || existing.processing_status === "ignored") {
      log.info("webhook.duplicate", { eventId, event });
      return { duplicate: true, status: existing.processing_status };
    }
    rowId = existing.id;
  }

  try {
    const out = await processRazorpayEvent(event, payload);
    await db.from("payment_events").update({
      processing_status: out.status, processing_error: out.note ?? null, processed_at: new Date().toISOString(),
      order_id: out.orderId ?? null, attempt_id: out.attemptId ?? null,
    }).eq("id", rowId);
    log.info("webhook.processed", { eventId, event, status: out.status, orderId: out.orderId });
    return { duplicate: false, status: out.status };
  } catch (e) {
    await db.from("payment_events").update({
      processing_status: "failed", processing_error: e instanceof Error ? e.message.slice(0, 500) : String(e),
    }).eq("id", rowId);
    log.error("webhook.process_failed", e, { eventId, event });
    throw e;
  }
}
