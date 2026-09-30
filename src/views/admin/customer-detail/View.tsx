import Link from "next/link";
import { DefinitionList, PageHeader, Panel } from "@/components/admin/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { formatPrice } from "@/lib/format";
import type { AdminCustomerDetail } from "@/types/admin";
import { fmtDateTime } from "../orders/components/fmt";
import { Journey } from "./components/Journey";
import { StatusControl } from "./components/StatusControl";

export function CustomerDetailView({ data }: { data: AdminCustomerDetail }) {
  const { customer: c, addresses, orders, tickets, journey } = data;
  return (
    <>
      <PageHeader title={c.fullName ?? c.email ?? "Customer"} description={c.email ?? undefined} actions={<StatusControl customer={c} />} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <Panel title="Orders" description={`${c.orders} orders · lifetime ${formatPrice(c.lifetimeValue)}`}>
            {orders.length === 0 ? <p className="t-meta">No orders yet.</p> : (
              <ul className="divide-y divide-line-soft">
                {orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-body">
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-medium hover:underline">{o.orderNumber}</Link>
                    <span className="t-meta">{fmtDateTime(o.placedAt)}</span><StatusBadge status={o.status} /><span className="tabular-nums">{formatPrice(o.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Journey entries={journey} />
        </div>
        <div className="flex flex-col gap-6">
          <Panel title="Profile">
            <DefinitionList items={[
              { label: "Phone", value: c.phone ?? "-" }, { label: "Role", value: c.role.replace(/_/g, " ") },
              { label: "Joined", value: fmtDateTime(c.createdAt) }, { label: "Last seen", value: fmtDateTime(c.lastSeenAt) },
            ]} />
          </Panel>
          <Panel title="Addresses">
            {addresses.length === 0 ? <p className="t-meta">None saved.</p> : (
              <ul className="flex flex-col gap-3">{addresses.map((a) => (
                <li key={a.id} className="text-body">{a.name}{a.isDefault && <span className="t-meta"> · default</span>}<span className="t-meta block">{[a.line1, a.line2, a.city, a.state, a.postalCode].filter(Boolean).join(", ")}</span></li>
              ))}</ul>
            )}
          </Panel>
          <Panel title="Support tickets">
            {tickets.length === 0 ? <p className="t-meta">No tickets.</p> : (
              <ul className="flex flex-col gap-2">{tickets.map((t) => <li key={t.id} className="text-body">{t.ticketNumber} · {t.subject} <StatusBadge status={t.status} /></li>)}</ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
