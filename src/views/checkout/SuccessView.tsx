import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { checkoutCopy } from "@/data/checkout";
import type { AccountOrder } from "@/data/orders";
import { OrderSummary } from "./components/OrderSummary";
import { StoredSummary } from "./components/StoredSummary";

export function SuccessView({ number, order, guest }: { number: string; order?: AccountOrder; guest: boolean }) {
  return (
    <div className="mx-auto grid max-w-3xl gap-8 py-10 sm:py-16">
      <header className="grid justify-items-center gap-3 text-center">
        <CheckCircle2 className="size-10 text-success" aria-hidden />
        <p className="t-overline text-ink-soft">Order confirmed</p>
        <h1 className="t-display">{checkoutCopy.successTitle}</h1>
        <p className="text-body-lg">Order number <span className="font-semibold">{number}</span></p>
        {order && <p className="t-meta">A confirmation has been sent to {order.email}</p>}
      </header>

      <ol className="grid gap-3 sm:grid-cols-3">
        {checkoutCopy.successNext.map((s, i) => (
          <li key={s.title} className="rounded-md border border-line bg-surface p-4">
            <p className="t-overline text-ink-soft">Step {i + 1}</p>
            <p className="mt-1 font-medium">{s.title}</p>
            <p className="t-meta">{s.body}</p>
          </li>
        ))}
      </ol>

      {order
        ? <OrderSummary lines={order.items} totals={order.totals} />
        : <StoredSummary number={number} />}

      {guest ? (
        <section className="grid gap-3 rounded-md bg-surface-warm p-6 text-center">
          <p className="t-h3">Save this order to an account</p>
          <p className="text-body text-ink-soft">{checkoutCopy.guestPrompt}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/signup">Create account</ButtonLink>
            <ButtonLink href="/" variant="ghost">Continue shopping</ButtonLink>
          </div>
        </section>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          <ButtonLink href={`/account/orders/${number}`}>View order</ButtonLink>
          <ButtonLink href="/" variant="secondary">Continue shopping</ButtonLink>
        </div>
      )}
    </div>
  );
}
