"use client";

import { ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { checkoutCopy, checkoutSteps, paymentMethods, shippingMethods, type FailureStage } from "@/data/checkout";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/stores/cart";
import type { Address } from "@/types/domain";
import { AddressStep } from "./components/AddressStep";
import { ContactStep } from "./components/ContactStep";
import { CouponField } from "./components/CouponField";
import { OrderSummary } from "./components/OrderSummary";
import { PaymentFailure } from "./components/PaymentFailure";
import { PaymentStep, unavailable } from "./components/PaymentStep";
import { ShippingStep } from "./components/ShippingStep";
import { StepCard } from "./components/StepCard";
import { LAST_ORDER_KEY } from "./components/StoredSummary";
import { Stepper } from "./components/Stepper";
import { placeOrder } from "./placeOrder";
import type { AddressValues, ContactValues } from "./schema";
import { estimateTotals } from "./totals";

// cart store uses skipHydration (no CartDrawer here), so rehydrate on mount and wait for it
const onHydrated = (cb: () => void) => useCart.persist.onFinishHydration(cb);

export function CheckoutView({ user, savedAddresses }: {
  user: { name: string; email: string; phone: string } | null; savedAddresses: Address[];
}) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(onHydrated, () => useCart.persist.hasHydrated(), () => false);
  useEffect(() => { void useCart.persist.rehydrate(); }, []);
  const lines = useCart((s) => s.lines);
  const coupon = useCart((s) => s.coupon);
  const setCoupon = useCart((s) => s.setCoupon);
  const clearCart = useCart((s) => s.clear);
  const [step, setStep] = useState(0);
  const [contact, setContact] = useState<ContactValues | undefined>(user ? { email: user.email, phone: user.phone, marketing: false } : undefined);
  const [address, setAddress] = useState<AddressValues>();
  const [shippingId, setShippingId] = useState<string>();
  const [paymentId, setPaymentId] = useState<string>();
  const [placing, setPlacing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<{ orderNumber: string; stage: FailureStage }>();
  const [pendingOrder, setPendingOrder] = useState<string>();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const shipping = shippingMethods.find((m) => m.id === shippingId);
  const payment = paymentMethods.find((m) => m.id === paymentId);
  const totals = estimateTotals(lines, { shipping, payment, coupon });

  if (!hydrated) return <div className="grid gap-4 py-10"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-64" /></div>;
  if (lines.length === 0 && !failure) {
    return (
      <div className="py-16">
        <EmptyState icon={<ShoppingBag className="size-8" />} title={checkoutCopy.emptyTitle} body={checkoutCopy.emptyBody}
          action={<ButtonLink href="/">Continue shopping</ButtonLink>} />
      </div>
    );
  }

  async function submit() {
    if (!contact || !address || !shippingId || !paymentId) return;
    if (payment && unavailable(payment, totals.total)) return toast.error("Please choose another payment method.");
    setPlacing(true);
    const res = await placeOrder({
      contact, address: { ...address, country: "IN" }, shippingMethodId: shippingId, paymentMethodId: paymentId,
      coupon, lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), orderNumber: pendingOrder,
    }, `${idempotencyKey}-${attempt}`, attempt);
    setAttempt((a) => a + 1);
    if (res.kind === "redirect") return window.location.assign(res.url);
    setPlacing(false);
    if (res.kind === "error") return toast.error(res.message);
    if (res.kind === "failed") {
      setPendingOrder(res.orderNumber);
      return setFailure({ orderNumber: res.orderNumber, stage: res.stage });
    }
    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ number: res.orderNumber, email: contact.email, lines, totals: { ...totals, appliedCoupon: coupon } }));
    } catch { /* storage blocked: success page still shows the order number */ }
    clearCart();
    router.push(`/checkout/success/${res.orderNumber}${user ? "" : "?guest=1"}`);
  }

  const summaries = [
    contact && `${contact.email} · ${contact.phone}`,
    address && `${address.name}, ${address.line1}, ${address.city} ${address.postalCode}`,
    shipping && `${shipping.label} · ${shipping.eta}`,
  ];

  return (
    <div className="grid gap-4 py-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-x-12">
      <button type="button" onClick={() => setSummaryOpen((o) => !o)} aria-expanded={summaryOpen} aria-controls="checkout-summary"
        className="flex min-h-11 items-center justify-between rounded-sm border border-line bg-surface-warm px-4 text-body lg:hidden">
        <span>{summaryOpen ? "Hide" : "Show"} order summary</span>
        <span className="font-semibold">{formatPrice(totals.total)}</span>
      </button>
      <aside id="checkout-summary" className={`${summaryOpen ? "block" : "hidden"} lg:col-start-2 lg:row-start-1 lg:block`}>
        <div className="lg:sticky lg:top-6">
          <OrderSummary lines={lines} totals={{ ...totals, appliedCoupon: coupon }} shippingKnown={!!shipping} note={checkoutCopy.estimateNote}>
            <CouponField value={coupon} valid={totals.couponValid} onApply={setCoupon} />
          </OrderSummary>
        </div>
      </aside>

      <div className="grid content-start gap-4 lg:col-start-1 lg:row-start-1">
        <h1 className="t-h1">Checkout</h1>
        <Stepper steps={checkoutSteps} current={step} onSelect={failure ? undefined : setStep} />

        {checkoutSteps.map((s, i) => (
          <StepCard key={s.id} index={i} label={s.label} state={i < step ? "done" : i === step ? "current" : "todo"}
            summary={summaries[i] || undefined} onEdit={failure ? undefined : () => setStep(i)}>
            {i === 0 && <ContactStep defaultValues={contact} signedIn={!!user} onDone={(v) => { setContact(v); setStep(1); }} />}
            {i === 1 && <AddressStep saved={savedAddresses} value={address} onDone={(v) => { setAddress(v); setStep(2); }} />}
            {i === 2 && <ShippingStep methods={shippingMethods} value={shippingId} net={totals.subtotal - totals.discount}
              onDone={(id) => { setShippingId(id); setStep(3); }} />}
            {i === 3 && (failure ? (
              <PaymentFailure {...failure} retrying={placing} onRetry={submit}
                onChangeMethod={() => { setFailure(undefined); setPaymentId(undefined); }} />
            ) : (
              <PaymentStep methods={paymentMethods} value={paymentId} onChange={setPaymentId}
                total={totals.total} placing={placing} onPlace={submit} />
            ))}
          </StepCard>
        ))}
      </div>
    </div>
  );
}
