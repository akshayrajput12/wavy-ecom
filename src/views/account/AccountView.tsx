import Link from "next/link";
import type { ReactNode } from "react";
import type { AccountUser } from "@/backend/account/repo";
import { ButtonLink } from "@/components/ui/Button";
import { accountCopy } from "@/data/copy";
import { formatDate } from "@/lib/format";
import type { Address, OrderSummary, ReturnRequest } from "@/types/domain";
import { OrderRow } from "@/views/orders/components/OrderRow";
import { ac } from "./copy";

const OPEN_RETURN = ["requested", "approved", "pickup_scheduled", "received"];

export function AccountView({ user, orders, returns, defaultAddress }: {
  user: AccountUser; orders: OrderSummary[]; returns: ReturnRequest[]; defaultAddress?: Address;
}) {
  const open = returns.filter((r) => OPEN_RETURN.includes(r.status)).length;
  return (
    <div className="grid gap-8">
      <header>
        <p className="t-overline text-ink-soft">{ac.overline}</p>
        <h1 className="t-display">{ac.hello(user.name.split(" ")[0])}</h1>
        {user.memberSince && <p className="t-meta">{ac.memberSince(formatDate(user.memberSince))}</p>}
      </header>

      <section aria-labelledby="recent-h" className="grid gap-3">
        <div className="flex items-baseline justify-between">
          <h2 id="recent-h" className="t-h3">{ac.recent}</h2>
          {orders.length > 0 && <Link href="/account/orders" className="inline-flex min-h-11 items-center text-meta underline underline-offset-4">{ac.viewAll}</Link>}
        </div>
        {orders.length ? (
          <ul className="grid gap-3">{orders.slice(0, 3).map((o) => <li key={o.id}><OrderRow order={o} /></li>)}</ul>
        ) : (
          <p className="text-body text-ink-soft">{accountCopy.ordersEmpty}</p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title={ac.profile} href="/account/profile" cta={ac.editProfile}>{user.name}<br />{user.email}<br />{user.phone}</Card>
        <Card title={ac.defaultAddress} href="/account/addresses" cta={ac.manageAddresses}>
          {defaultAddress ? <>{defaultAddress.line1}<br />{defaultAddress.city}, {defaultAddress.postalCode}</> : accountCopy.addressesEmpty}
        </Card>
        <Card title={ac.returns} href="/account/returns" cta={ac.viewReturns}>{ac.openReturns(open)}</Card>
      </div>
    </div>
  );
}

function Card({ title, href, cta, children }: { title: string; href: string; cta: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-5">
      <h2 className="t-h3">{title}</h2>
      <p className="flex-1 text-body text-ink-soft">{children}</p>
      <ButtonLink href={href} variant="link" className="min-h-11 self-start">{cta}</ButtonLink>
    </section>
  );
}
