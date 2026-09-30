import type { AddressValues, ContactValues } from "./schema";

/** Checkout progress, autosaved to sessionStorage (tab-scoped: never outlives the session, never shared). */
export interface CheckoutDraft {
  step: number;
  contact: Partial<ContactValues>;
  address: Partial<AddressValues>;
  /** Saved address picked by a signed-in shopper ("new" = typed address). */
  addressId?: string;
  saveAddress?: boolean;
  shippingMethodId?: string;
  paymentProvider?: "razorpay" | "cod";
  /** Idempotency-Key for the current submit, bound to the payload fingerprint. */
  attempt?: { fp: string; key: string };
}

const KEY = "wavy:checkout";
export const emptyDraft: CheckoutDraft = { step: 0, contact: {}, address: {} };

export function loadDraft(): CheckoutDraft {
  try {
    const raw = sessionStorage.getItem(KEY);
    const d = raw ? (JSON.parse(raw) as Partial<CheckoutDraft>) : {};
    return { ...emptyDraft, ...d, contact: d.contact ?? {}, address: d.address ?? {} };
  } catch {
    return emptyDraft;
  }
}

export function saveDraft(d: CheckoutDraft) {
  try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage blocked: checkout still works */ }
}

export function clearDraft() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

/**
 * Idempotency key per attempt: the same payload re-submitted (double tap, network retry, reload) reuses the key,
 * so place_order replays the same order; any change to the payload starts a new attempt with a fresh key.
 */
export function attemptFor(body: unknown, prev: CheckoutDraft["attempt"], newKey: () => string = () => crypto.randomUUID()) {
  const fp = JSON.stringify(body);
  return prev?.fp === fp ? prev : { fp, key: `co_${newKey()}` };
}
