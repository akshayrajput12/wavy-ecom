import { RotateCcw } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { accountCopy } from "@/data/account";
import type { ReturnRequest } from "@/data/orders";
import { formatDate } from "@/lib/format";

export function ReturnsView({ returns, eligibleOrders }: { returns: ReturnRequest[]; eligibleOrders: string[] }) {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="t-h1">Returns</h1>
        {eligibleOrders[0] && <ButtonLink size="sm" href={`/account/returns/new?order=${eligibleOrders[0]}`}>Start a return</ButtonLink>}
      </div>
      {returns.length === 0 ? (
        <EmptyState icon={<RotateCcw className="size-8" />} title={accountCopy.returnsEmpty} body={accountCopy.returnNotEligible} />
      ) : (
        <ul className="grid gap-3">
          {returns.map((r) => (
            <li key={r.ref} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-4">
              <div>
                <p className="font-medium">{r.ref} · {r.itemName}</p>
                <p className="t-meta">Order #{r.orderNumber} · {r.reason} · Requested {formatDate(r.createdAt)}</p>
              </div>
              <StatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
