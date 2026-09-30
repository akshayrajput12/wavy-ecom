import { CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { accountCopy } from "@/data/account";

export function ReturnSuccessView({ reference, orderNumber }: { reference: string; orderNumber?: string }) {
  return (
    <div className="grid max-w-2xl gap-6">
      <header className="grid gap-2">
        <CheckCircle2 className="size-8 text-success" aria-hidden />
        <p className="t-overline text-ink-soft">Return requested</p>
        <h1 className="t-h1">We&apos;ve received your request</h1>
        <p className="text-body-lg">Reference <span className="font-semibold">{reference}</span>{orderNumber && <> · Order #{orderNumber}</>}</p>
      </header>
      <section aria-labelledby="next-h" className="rounded-md border border-line bg-surface p-5">
        <h2 id="next-h" className="t-h3">What happens next</h2>
        <ol className="mt-3 grid list-decimal gap-2 pl-5 text-body text-ink-soft">
          {accountCopy.returnSuccessSteps.map((s) => <li key={s}>{s}</li>)}
        </ol>
      </section>
      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/account/returns">View my returns</ButtonLink>
        <ButtonLink href="/" variant="secondary">Continue shopping</ButtonLink>
      </div>
    </div>
  );
}
