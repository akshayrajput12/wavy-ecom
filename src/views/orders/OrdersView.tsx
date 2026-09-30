import { Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { accountCopy } from "@/data/account";
import type { AccountOrder } from "@/data/orders";
import { OrderRow } from "./components/OrderRow";

export function OrdersView({ orders }: { orders: AccountOrder[] }) {
  return (
    <div className="grid gap-6">
      <h1 className="t-h1">Orders</h1>
      {orders.length === 0 ? (
        <EmptyState icon={<Package className="size-8" />} title={accountCopy.ordersEmpty} action={<ButtonLink href="/">Start shopping</ButtonLink>} />
      ) : (
        <ul className="grid gap-3">{orders.map((o) => <li key={o.id}><OrderRow order={o} /></li>)}</ul>
      )}
    </div>
  );
}
