"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { PageHeader } from "@/components/admin/Panel";
import type { Customer } from "@/data/admin/types";
import { formatDate, formatPrice } from "@/lib/format";

const columns: Column<Customer>[] = [
  { key: "name", header: "Customer", sort: (c) => c.name, cell: (c) => (
    <Link href={`/admin/customers/${c.id}`} className="hover:underline"><span className="block font-medium">{c.name}</span><span className="t-meta">{c.email}</span></Link>
  ) },
  { key: "city", header: "City", sort: (c) => c.city, cell: (c) => c.city },
  { key: "orders", header: "Orders", align: "right", sort: (c) => c.orders, cell: (c) => c.orders },
  { key: "ltv", header: "Lifetime value", align: "right", sort: (c) => c.lifetimeValue, cell: (c) => formatPrice(c.lifetimeValue) },
  { key: "last", header: "Last order", sort: (c) => c.lastOrderAt ?? "", cell: (c) => (c.lastOrderAt ? formatDate(c.lastOrderAt) : "—") },
  { key: "tags", header: "Tags", cell: (c) => <span className="flex flex-wrap gap-1">{c.tags.map((t) => <Badge key={t}>{t}</Badge>)}</span> },
];

export function CustomersView({ customers }: { customers: Customer[] }) {
  const tags = [...new Set(customers.flatMap((c) => c.tags))];
  return (
    <>
      <PageHeader title="Customers" description="Everyone who has an account or has placed an order." />
      <DataTable
        caption="Customers" rows={customers} columns={columns} getId={(c) => c.id}
        search={(c) => `${c.name} ${c.email} ${c.phone} ${c.city}`} searchPlaceholder="Search name, email, phone or city"
        filters={[
          { key: "tag", label: "Tag", options: tags.map((t) => ({ value: t, label: t })), match: (c, v) => c.tags.includes(v) },
          { key: "buyer", label: "Orders", options: [{ value: "repeat", label: "Repeat buyers" }, { value: "none", label: "No orders" }], match: (c, v) => (v === "repeat" ? c.orders > 1 : c.orders === 0) },
        ]}
        empty={{ title: "No customers yet" }}
      />
    </>
  );
}
