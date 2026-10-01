import Link from "next/link";
import { PageHeader } from "@/components/admin/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { ORDER_STATUS, PAYMENT_PROVIDER, PAYMENT_STATUS } from "@/types/domain";
import type { AdminOrderRow, Paginated } from "@/types/admin";
import { formatPrice } from "@/lib/format";
import { BulkInvoices, SelectOrder } from "./components/BulkInvoices";
import { fmtDateTime } from "./components/fmt";
import { FilterBar, Pager } from "./components/list";
import { opts, SimpleTable, type Col } from "./components/table";

const cols: Col<AdminOrderRow>[] = [
  { header: "Select", cell: (o) => <SelectOrder id={o.id} number={o.orderNumber} /> },
  { header: "Order", cell: (o) => <Link href={`/admin/orders/${o.orderNumber}`} className="font-medium hover:underline">{o.orderNumber}</Link> },
  { header: "Customer", cell: (o) => <><span className="block">{o.customerName}</span><span className="t-meta">{o.email}</span></> },
  { header: "Placed", cell: (o) => fmtDateTime(o.placedAt) },
  { header: "Items", right: true, cell: (o) => o.itemCount },
  { header: "Payment", cell: (o) => <span className="flex flex-col items-start gap-1"><StatusBadge status={o.paymentStatus} /><span className="t-meta">{o.paymentProvider}</span></span> },
  { header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
  { header: "Total", right: true, cell: (o) => formatPrice(o.total) },
];

/** `invoiceRange`: the From/To filter as IST bounds, for "download all invoices issued in range". */
export function OrdersView({ orders, invoiceRange }: { orders: Paginated<AdminOrderRow>; invoiceRange?: { from: string; to: string } }) {
  return (
    <>
      <PageHeader title="Orders" description="Every order with payment and fulfilment state." />
      <FilterBar filters={[
        { key: "q", label: "Search (number, name, email, phone)" },
        { key: "status", label: "Status", options: opts(ORDER_STATUS) },
        { key: "paymentStatus", label: "Payment", options: opts(PAYMENT_STATUS) },
        { key: "provider", label: "Provider", options: opts(PAYMENT_PROVIDER) },
        { key: "from", label: "From", type: "date" }, { key: "to", label: "To", type: "date" },
      ]} />
      <BulkInvoices key={`${orders.page}:${orders.items[0]?.id}`} range={invoiceRange}>
        <SimpleTable caption="Orders" rows={orders.items} cols={cols} getId={(o) => o.id} empty="No orders match" />
      </BulkInvoices>
      <Pager page={orders.page} pageSize={orders.pageSize} total={orders.total} />
    </>
  );
}
