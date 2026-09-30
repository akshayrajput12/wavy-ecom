import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { accountCopy } from "@/data/account";
import type { AccountOrder } from "@/data/orders";
import type { OrderItem } from "@/types/domain";
import { ReturnForm } from "./components/ReturnForm";

export function ReturnRequestView({ order, items, preselect }: { order?: AccountOrder; items: OrderItem[]; preselect?: string }) {
  return (
    <div className="grid max-w-2xl gap-6">
      <Link href={order ? `/account/orders/${order.number}` : "/account/returns"} className="inline-flex min-h-11 items-center gap-2 text-meta text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Back
      </Link>
      <header>
        <h1 className="t-h1">Request a return</h1>
        {order && <p className="t-meta">Order #{order.number}</p>}
      </header>
      {order && items.length > 0 ? (
        <ReturnForm orderNumber={order.number} items={items} preselect={items.some((i) => i.id === preselect) ? preselect : undefined} />
      ) : (
        <EmptyState title={order ? "Nothing to return on this order" : "Order not found"} body={accountCopy.returnNotEligible}
          action={<ButtonLink href="/account/orders" variant="secondary">Back to orders</ButtonLink>} />
      )}
    </div>
  );
}
