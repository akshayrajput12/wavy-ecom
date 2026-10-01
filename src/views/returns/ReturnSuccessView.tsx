import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ac } from "@/views/account/copy";

export function ReturnSuccessView({ reference, orderNumber }: { reference: string; orderNumber?: string }) {
  return (
    <div className="grid max-w-2xl gap-8">
      <header className="grid gap-3">
        <span className="grid size-12 place-items-center rounded-pill bg-ink text-canvas"><CheckCircle2 className="size-6" aria-hidden /></span>
        <p className="t-overline">{ac.returns}</p>
        <h1 className="t-display">{ac.returnReceived}</h1>
        <p className="text-body-lg text-ink-soft">{ac.reference} <span className="t-index text-body text-ink">{reference}</span>{orderNumber && <> · {ac.order(orderNumber)}</>}</p>
      </header>
      <ol className="grid gap-x-6 rounded-xl bg-surface-warm p-6 sm:grid-cols-3 sm:p-8">
        {ac.returnNext.map((s, i) => (
          <li key={s} className="grid content-start gap-2 border-t border-ink/20 py-4 text-body text-ink-soft">
            <span className="t-index text-ink">{String(i + 1).padStart(2, "0")}</span>{s}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/account/returns">{ac.viewMyReturns}</ButtonLink>
        <ButtonLink href="/" variant="secondary">{ac.continueShopping}</ButtonLink>
      </div>
    </div>
  );
}
