import { ArrowLeftIcon } from "@/components/ui/icons";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { accountCopy } from "@/data/copy";
import type { Order, OrderItem } from "@/types/domain";
import { ac } from "@/views/account/copy";
import { ReturnForm } from "./components/ReturnForm";

export function ReturnRequestView({ order, items, preselect }: { order: Order | null; items: OrderItem[]; preselect?: string }) {
  return (
    <div className="grid max-w-2xl gap-8">
      <Link href={order ? `/account/orders/${order.number}` : "/account/returns"} className="inline-flex min-h-11 items-center gap-2 self-start text-meta text-ink-soft hover:text-ink">
        <ArrowLeftIcon className="size-4" /> {ac.back}
      </Link>
      <header className="grid gap-3">
        <p className="t-overline">{ac.returns}</p>
        <h1 className="t-h1">{accountCopy.requestReturn}</h1>
        {order && <p className="text-body text-ink-soft">{ac.returnFor(order.number)}</p>}
      </header>
      {order && items.length > 0 ? (
        <ReturnForm order={order} items={items} preselect={items.some((i) => i.id === preselect) ? preselect : undefined} />
      ) : (
        <EmptyState title={order ? ac.nothingToReturn : ac.notFound} body={accountCopy.returnNotEligible}
          action={<ButtonLink href="/account/orders" variant="secondary">{ac.backToOrders}</ButtonLink>} />
      )}
    </div>
  );
}
