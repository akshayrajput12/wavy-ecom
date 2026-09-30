import { RotateCcw } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { accountCopy, returnReasonLabels } from "@/data/copy";
import { formatDate, formatPrice } from "@/lib/format";
import type { OrderSummary, ReturnRequest } from "@/types/domain";
import { ac } from "@/views/account/copy";

export function ReturnsView({ returns, orders }: { returns: ReturnRequest[]; orders: OrderSummary[] }) {
  const numberOf = new Map(orders.map((o) => [o.id, o.number]));
  const delivered = orders.find((o) => o.status === "delivered");
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="t-h1">{ac.returns}</h1>
        {delivered && <ButtonLink href={`/account/returns/new?order=${encodeURIComponent(delivered.number)}`}>{ac.startReturn}</ButtonLink>}
      </div>
      {returns.length === 0 ? (
        <EmptyState icon={<RotateCcw className="size-8" aria-hidden />} title={accountCopy.returnsEmpty}
          action={<ButtonLink href="/account/orders" variant="secondary">{ac.orders}</ButtonLink>} />
      ) : (
        <ul className="grid gap-3">
          {returns.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4">
              <div>
                <p className="font-medium">{r.rmaNumber}{numberOf.get(r.orderId) && <span className="font-normal text-ink-soft"> · {ac.order(numberOf.get(r.orderId)!)}</span>}</p>
                <p className="t-meta">
                  {returnReasonLabels[r.reason]} · {ac.requested(formatDate(r.createdAt))}
                  {r.refundAmount !== undefined && ` · ${ac.refund(formatPrice(r.refundAmount))}`}
                </p>
              </div>
              <StatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
