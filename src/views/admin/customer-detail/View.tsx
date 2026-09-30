import Link from "next/link";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { DefinitionList, PageHeader, Panel } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import type { AdminOrder, Customer } from "@/data/admin/types";
import { formatDate, formatPrice } from "@/lib/format";
import { Journey } from "./components/Journey";

/** One-shot customer 360: profile, value, orders, journey, payment attempts, tickets. */
export function CustomerDetailView({ customer: c, orders }: { customer: Customer; orders: AdminOrder[] }) {
  const attempts = orders.flatMap((o) => o.paymentAttempts.map((a) => ({ ...a, order: o.number }))).sort((a, b) => b.at.localeCompare(a.at));
  const stats = [
    ["Lifetime value", formatPrice(c.lifetimeValue)], ["Orders", String(c.orders)],
    ["Avg. order", c.orders ? formatPrice(Math.round(c.lifetimeValue / c.orders)) : "—"], ["Customer since", formatDate(c.joinedAt)],
  ];
  return (
    <>
      <PageHeader title={c.name} description={`${c.email} · ${c.city}`} />
      <div className="mb-6 flex flex-wrap gap-1.5">{c.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>
      <dl className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-md border border-line bg-surface p-4"><dt className="t-overline text-ink-soft">{k}</dt><dd className="mt-1 text-h3 font-semibold tabular-nums">{v}</dd></div>
        ))}
      </dl>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          <Panel title="Orders">
            {orders.length === 0 ? <p className="t-meta">No orders yet.</p> : (
              <ul className="divide-y divide-line-soft">
                {orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center gap-3 py-2.5 text-body">
                    <Link href={`/admin/orders/${o.number}`} className="font-medium hover:underline">{o.number}</Link>
                    <span className="t-meta">{formatDate(o.placedAt)}</span>
                    <StatusBadge status={o.status} />
                    <span className="ml-auto tabular-nums">{formatPrice(o.totals.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title="Payment attempts" description="Across all orders, newest first">
            {attempts.length === 0 ? <p className="t-meta">No payment attempts.</p> : (
              <ul className="divide-y divide-line-soft">
                {attempts.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center gap-3 py-2.5 text-body">
                    <StatusBadge status={a.status} />
                    <span>{a.method} · {formatPrice(a.amount)}</span>
                    <span className="t-meta">{a.order} · {formatDateTime(a.at)}</span>
                    {a.message && <span className="w-full text-meta text-danger">{a.message}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="flex flex-col gap-6">
          <Panel title="Profile"><DefinitionList items={[{ label: "Email", value: c.email }, { label: "Phone", value: c.phone }, { label: "City", value: c.city }]} /></Panel>
          <Journey events={c.journey} />
          <Panel title="Support tickets">
            {c.tickets.length === 0 ? <p className="t-meta">No tickets.</p> : (
              <ul className="flex flex-col gap-2">
                {c.tickets.map((t) => (
                  <li key={t.id} className="flex items-start justify-between gap-3 text-body">
                    <span><span className="font-medium">{t.id}</span> · {t.subject}<span className="t-meta block">{formatDate(t.at)}</span></span>
                    <Badge tone={t.status === "resolved" ? "success" : t.status === "open" ? "warning" : "info"} dot>{t.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
