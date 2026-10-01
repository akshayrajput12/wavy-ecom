"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AccountUser } from "@/backend/account/repo";
import { Stepper } from "@/components/ui/Progress";
import { checkoutCopy } from "@/data/copy";
import { useCart, useCartQuote } from "@/stores/cart";
import type { Address, PaymentOption, StoreSettings } from "@/types/domain";
import { ContactStep } from "./components/ContactStep";
import { CheckoutSummary } from "./components/CheckoutSummary";
import { DeliveryStep } from "./components/DeliveryStep";
import { PaymentFailure } from "./components/PaymentFailure";
import { PaymentStep, type Provider } from "./components/PaymentStep";
import { StepCard } from "./components/StepCard";
import { checkoutSteps3, co } from "./copy";
import { attemptFor, loadDraft, saveDraft, type CheckoutDraft } from "./draft";
import { addressSchema, contactSchema, type AddressValues } from "./schema";
import { usePayment } from "./usePayment";

export type CheckoutProps = { user: AccountUser | null; savedAddresses: Address[]; paymentOptions: PaymentOption[]; settings: StoreSettings | null };

/** Contact -> Delivery -> Payment on one page. Mounted client-side only (after the bag hydrates). */
export function CheckoutFlow({ user, savedAddresses, paymentOptions, settings }: CheckoutProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<CheckoutDraft>(() => {
    const d = loadDraft();
    return user && !d.contact.email ? { ...d, contact: { email: user.email, phone: user.phone || undefined } } : d;
  });
  useEffect(() => saveDraft(draft), [draft]);
  const patch = useCallback((p: Partial<CheckoutDraft>) => setDraft((d) => ({ ...d, ...p })), []);
  const onContact = useCallback((contact: CheckoutDraft["contact"]) => patch({ contact }), [patch]);

  const lines = useCart((s) => s.lines);
  const coupon = useCart((s) => s.coupon);
  const contact = contactSchema.safeParse(draft.contact);
  const address = addressSchema.safeParse(draft.address);
  const step = !contact.success ? 0 : draft.step >= 2 && !address.success ? 1 : Math.min(draft.step, 2);

  const usable = paymentOptions.filter((o) => o.provider === "razorpay" || o.provider === "cod");
  const provider = (draft.paymentProvider ?? usable[0]?.provider) as Provider | undefined;
  const context = {
    email: contact.success ? contact.data.email : undefined, state: draft.address.state || undefined,
    shippingMethodId: draft.shippingMethodId, paymentProvider: step === 2 ? provider : undefined,
  };
  const q = useCartQuote(context);
  const net = q.quote ? q.quote.subtotal - q.quote.offerDiscount - q.quote.couponDiscount : 0;

  const pay = usePayment((order) => router.push(`/checkout/success/${order.number}?token=${encodeURIComponent(order.trackingToken)}`));
  const busy = ["placing", "paying", "verifying", "done"].includes(pay.state.phase);

  // bring the newly opened step into view (mobile), not on first render
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    document.getElementById(`step-${step}-h`)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [step]);

  function submit() {
    if (!contact.success || !address.success || !provider) return;
    const { isDefault: _ignored, ...a } = address.data;
    const body = {
      email: contact.data.email, phone: contact.data.phone, customerName: a.name,
      shippingAddress: { ...a, country: "IN" }, items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      couponCode: coupon, shippingMethodId: draft.shippingMethodId, paymentProvider: provider,
      saveAddress: user && (draft.addressId ?? "new") === "new" ? !!draft.saveAddress : undefined,
    };
    const attempt = attemptFor(body, draft.attempt);
    patch({ attempt });
    void pay.place(body, attempt.key);
  }

  const edit = (i: number) => () => { if (!busy) { pay.reset(); patch({ step: i }); } };
  const state = (i: number) => (i < step ? "done" : i === step ? "current" : "todo");
  const failed = pay.state.phase === "failed" ? pay.state : undefined;
  const a = draft.address as Partial<AddressValues>;

  return (
    <div className="grid gap-6 pb-28 pt-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-x-16 lg:pb-16 lg:pt-12">
      <div className="grid content-start gap-4">
        <header className="grid gap-3">
          <p className="t-overline">{checkoutCopy.stepOf(step + 1, checkoutSteps3.length)}</p>
          <h1 className="t-display">{co.title}</h1>
        </header>
        <Stepper steps={[...checkoutSteps3]} current={step} label={co.progress} className="my-4" />

        <StepCard index={0} label={checkoutSteps3[0]} state={state(0)} onEdit={edit(0)}
          summary={contact.success && `${contact.data.email} · ${contact.data.phone}`}>
          <ContactStep defaultValues={draft.contact} signedIn={!!user} onChange={onContact}
            onDone={(v) => patch({ contact: v, step: 1, address: { ...draft.address, phone: draft.address.phone || v.phone } })} />
        </StepCard>

        <StepCard index={1} label={checkoutSteps3[1]} state={state(1)} onEdit={edit(1)}
          summary={address.success && <>{[a.name, a.line1, a.city, a.postalCode].filter(Boolean).join(", ")}{q.quote?.shippingMethod && <span className="block">{q.quote.shippingMethod.name}</span>}</>}>
          <DeliveryStep saved={savedAddresses} signedIn={!!user} address={draft.address} addressId={draft.addressId} saveAddress={draft.saveAddress}
            shippingMethodId={draft.shippingMethodId} net={net} threshold={settings?.freeShippingThreshold}
            onChange={patch} onDone={(v) => draft.shippingMethodId && patch({ address: v, step: 2 })} />
        </StepCard>

        <StepCard index={2} label={checkoutSteps3[2]} state={state(2)}>
          {failed ? (
            <PaymentFailure orderNumber={failed.order.number} stage={failed.stage} retrying={busy} onRetry={() => void pay.retry()} supportEmail={settings?.supportEmail} />
          ) : (
            <PaymentStep options={usable} value={provider} onChange={(p) => patch({ paymentProvider: p })} total={q.quote?.total} codFee={settings?.codFee}
              error={pay.state.phase === "error" ? pay.state.message : q.orderErrors[0]} busy={busy}
              busyLabel={pay.state.phase === "paying" ? co.payment.opening : pay.state.phase === "verifying" ? co.payment.verifying : undefined}
              disabled={!q.quote || !q.quote.valid || q.loading} onPay={submit} returnDays={settings?.returnWindowDays} />
          )}
        </StepCard>
      </div>
      <div className="lg:col-start-2 lg:row-start-1">
        <CheckoutSummary q={q} threshold={settings?.freeShippingThreshold} context={context} />
      </div>
    </div>
  );
}
