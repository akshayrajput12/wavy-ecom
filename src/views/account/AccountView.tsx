import Link from "next/link";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import type { AccountUser } from "@/backend/orders/repo";
import type { AccountOrder, ReturnRequest } from "@/data/orders";
import type { Address } from "@/types/domain";
import { OrderRow } from "@/views/orders/components/OrderRow";

export function AccountView({ user, orders, returns, defaultAddress }: {
  user: AccountUser; orders: AccountOrder[]; returns: ReturnRequest[]; defaultAddress?: Address;
}) {
  const open = returns.filter((r) => r.status !== "closed" && r.status !== "refunded").length;
  return (
    <div className="grid gap-8">
      <header>
        <p className="t-overline text-ink-soft">Your account</p>
        <h1 className="t-display">Hello, {user.name.split(" ")[0] || "there"}</h1>
      </header>

      <section aria-labelledby="recent-h" className="grid gap-3">
        <div className="flex items-baseline justify-between">
          <h2 id="recent-h" className="t-h3">Recent orders</h2>
          <Link href="/account/orders" className="text-meta underline underline-offset-4">View all</Link>
        </div>
        {orders.length ? (
          <ul className="grid gap-3">{orders.slice(0, 2).map((o) => <li key={o.id}><OrderRow order={o} /></li>)}</ul>
        ) : (
          <p className="text-body text-ink-soft">No orders yet.</p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Profile" href="/account/profile" cta="Edit profile">
          {user.name}<br />{user.email}<br />{user.phone}
        </Card>
        <Card title="Default address" href="/account/addresses" cta="Manage addresses">
          {defaultAddress ? <>{defaultAddress.line1}<br />{defaultAddress.city}, {defaultAddress.postalCode}</> : "No saved address yet."}
        </Card>
        <Card title="Returns" href="/account/returns" cta="View returns">
          {open ? `${open} open ${open === 1 ? "request" : "requests"}` : "No open returns."}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, href, cta, children }: { title: string; href: string; cta: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-md border border-line bg-surface p-5">
      <h2 className="t-h3">{title}</h2>
      <p className="flex-1 text-body text-ink-soft">{children}</p>
      <ButtonLink href={href} variant="link" className="self-start">{cta}</ButtonLink>
    </section>
  );
}
