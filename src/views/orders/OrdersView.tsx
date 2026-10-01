import { Package } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { accountCopy } from "@/data/copy";
import type { OrderSummary } from "@/types/domain";
import { ac } from "@/views/account/copy";
import { OrderRow } from "./components/OrderRow";

export function OrdersView({ orders }: { orders: OrderSummary[] }) {
  return (
    <div className="grid gap-8">
      <header className="grid gap-3">
        <p className="t-overline">{ac.overline}</p>
        <h1 className="t-h1">{ac.orders} {orders.length > 0 && <span className="t-index align-middle text-ink-soft">({orders.length})</span>}</h1>
      </header>
      {orders.length === 0 ? (
        <EmptyState icon={<Package className="size-8" aria-hidden />} title={accountCopy.ordersEmpty} action={<ButtonLink href="/">{ac.startShopping}</ButtonLink>} />
      ) : (
        <ul className="grid gap-3">{orders.map((o) => <li key={o.id}><OrderRow order={o} /></li>)}</ul>
      )}
    </div>
  );
}
