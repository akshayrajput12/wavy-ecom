import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { toFailureStage, toPaymentMethod, verifyPaymentSignature, verifyWebhookSignature } from "./razorpay-crypto";

const SECRET = "test_secret";
const sign = (data: string, secret = SECRET) => createHmac("sha256", secret).update(data).digest("hex");

describe("verifyPaymentSignature", () => {
  const sig = sign("order_123|pay_456");
  it("accepts the HMAC of order_id|payment_id", () => {
    expect(verifyPaymentSignature("order_123", "pay_456", sig, SECRET)).toBe(true);
  });
  it("rejects tampered ids, wrong secret, wrong length and empty input", () => {
    expect(verifyPaymentSignature("order_123", "pay_999", sig, SECRET)).toBe(false);
    expect(verifyPaymentSignature("order_123", "pay_456", sig, "other")).toBe(false);
    expect(verifyPaymentSignature("order_123", "pay_456", sig.slice(1), SECRET)).toBe(false);
    expect(verifyPaymentSignature("order_123", "pay_456", "", SECRET)).toBe(false);
    expect(verifyPaymentSignature("order_123", "pay_456", sig, "")).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1" } } } });
  it("accepts the HMAC of the exact raw body", () => {
    expect(verifyWebhookSignature(body, sign(body), SECRET)).toBe(true);
  });
  it("rejects a re-serialised body, missing signature or secret", () => {
    expect(verifyWebhookSignature(body + " ", sign(body), SECRET)).toBe(false);
    expect(verifyWebhookSignature(body, null, SECRET)).toBe(false);
    expect(verifyWebhookSignature(body, sign(body), "")).toBe(false);
  });
});

describe("mappings", () => {
  it("maps Razorpay methods onto payment_method", () => {
    expect(toPaymentMethod("upi")).toBe("upi");
    expect(toPaymentMethod("cardless_emi")).toBeNull();
    expect(toPaymentMethod(undefined)).toBeNull();
  });
  it("maps error reasons onto failure stages", () => {
    expect(toFailureStage("payment_cancelled")).toBe("user_cancelled");
    expect(toFailureStage("insufficient_funds", "BAD_REQUEST_ERROR")).toBe("insufficient_funds");
    expect(toFailureStage("payment_timed_out")).toBe("otp_timeout");
    expect(toFailureStage("card_declined")).toBe("bank_declined");
    expect(toFailureStage(null, "GATEWAY_ERROR")).toBe("gateway_error");
    expect(toFailureStage("something_new")).toBe("unknown");
  });
});
