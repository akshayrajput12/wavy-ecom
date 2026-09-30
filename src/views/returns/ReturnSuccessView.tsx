import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { ac } from "@/views/account/copy";

export function ReturnSuccessView({ reference, orderNumber }: { reference: string; orderNumber?: string }) {
  return (
    <div className="grid max-w-2xl gap-6">
      <header className="grid gap-2">
        <CheckCircle2 className="size-8 text-success" aria-hidden />
        <h1 className="t-h1">{ac.returnReceived}</h1>
        <p className="text-body-lg">{ac.reference} <span className="font-semibold">{reference}</span>{orderNumber && <> · {ac.order(orderNumber)}</>}</p>
      </header>
      <ol className="grid list-decimal gap-2 rounded-lg border border-line bg-surface p-5 pl-10 text-body text-ink-soft">
        {ac.returnNext.map((s) => <li key={s}>{s}</li>)}
      </ol>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/account/returns">{ac.viewMyReturns}</ButtonLink>
        <ButtonLink href="/" variant="secondary">{ac.continueShopping}</ButtonLink>
      </div>
    </div>
  );
}
