import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { Panel } from "@/components/admin/Panel";
import type { AdminOrder } from "@/data/admin/types";
import { formatDate, formatPrice } from "@/lib/format";

export function RecentOrders({ orders }: { orders: AdminOrder[] }) {
  return (
    <Panel title="Recent orders" actions={<Link href="/admin/orders" className="text-meta underline underline-offset-4">All orders</Link>}>
      <div className="-mx-5 overflow-x-auto">
        <table className="w-full min-w-[560px] text-body">
          <caption className="sr-only">Most recent orders</caption>
          <thead className="text-left text-meta text-ink-soft">
            <tr>{["Order", "Customer", "Date", "Payment", "Status", "Total"].map((h) => <th key={h} scope="col" className="px-5 py-2 font-medium last:text-right">{h}</th>)}</tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-line-soft">
                <td className="px-5 py-2.5"><Link href={`/admin/orders/${o.number}`} className="font-medium underline-offset-4 hover:underline">{o.number}</Link></td>
                <td className="px-5 py-2.5">{o.customerName}</td>
                <td className="px-5 py-2.5 text-ink-soft">{formatDate(o.placedAt)}</td>
                <td className="px-5 py-2.5"><StatusBadge status={o.paymentStatus} /></td>
                <td className="px-5 py-2.5"><StatusBadge status={o.status} /></td>
                <td className="px-5 py-2.5 text-right tabular-nums">{formatPrice(o.totals.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
