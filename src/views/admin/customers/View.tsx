import Link from "next/link";
import { PageHeader } from "@/components/admin/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/format";
import type { AdminCustomerRow, Paginated } from "@/types/admin";
import { fmtDateTime } from "../orders/components/fmt";
import { FilterBar, opts, Pager, SimpleTable, type Col } from "../orders/components/list";

const cols: Col<AdminCustomerRow>[] = [
  { header: "Customer", cell: (c) => <Link href={`/admin/customers/${c.id}`} className="font-medium hover:underline">{c.fullName ?? c.email ?? c.id}</Link> },
  { header: "Contact", cell: (c) => <><span className="block">{c.email ?? "-"}</span><span className="t-meta">{c.phone ?? ""}</span></> },
  { header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
  { header: "Orders", right: true, cell: (c) => c.orders },
  { header: "Lifetime value", right: true, cell: (c) => formatPrice(c.lifetimeValue) },
  { header: "Last order", cell: (c) => fmtDateTime(c.lastOrderAt) },
  { header: "Joined", cell: (c) => fmtDateTime(c.createdAt) },
];

export function CustomersView({ customers }: { customers: Paginated<AdminCustomerRow> }) {
  return (
    <>
      <PageHeader title="Customers" description="Accounts with order history and lifetime value." />
      <FilterBar filters={[{ key: "q", label: "Search (name, email, phone)" }, { key: "status", label: "Status", options: opts(["active", "blocked", "deleted"]) }]} />
      <SimpleTable caption="Customers" rows={customers.items} cols={cols} getId={(c) => c.id} empty="No customers match" />
      <Pager page={customers.page} pageSize={customers.pageSize} total={customers.total} />
    </>
  );
}
