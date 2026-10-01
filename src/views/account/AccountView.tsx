import Link from "next/link";
import type { ReactNode } from "react";
import type { AccountUser } from "@/backend/account/repo";
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
    <div className="grid gap-12">
      <header className="grid gap-3">
        <p className="t-overline">{ac.overline}</p>
        <h1 className="t-display">{ac.hello(user.name.split(" ")[0])}</h1>
        {user.memberSince && <p className="text-body text-ink-soft">{ac.memberSince(formatDate(user.memberSince))}</p>}
      </header>

      <section aria-labelledby="recent-h" className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 id="recent-h" className="t-h2">{ac.recent}</h2>
          {orders.length > 0 && <Link href="/account/orders" className="inline-flex min-h-11 items-center text-meta underline underline-offset-4">{ac.viewAll} <span aria-hidden>›</span></Link>}
        </div>
        {orders.length ? (
          <ul className="grid gap-3">{orders.slice(0, 3).map((o) => <li key={o.id}><OrderRow order={o} /></li>)}</ul>
        ) : (
          <p className="rounded-lg bg-surface-warm p-6 text-body text-ink-soft">{accountCopy.ordersEmpty}</p>
        )}
      </section>

      <div className="grid gap-x-6 gap-y-8 rounded-xl bg-surface-warm p-6 sm:p-8 md:grid-cols-3">
        <Card n={1} title={ac.profile} href="/account/profile" cta={ac.editProfile}>{user.name}<br />{user.email}<br />{user.phone}</Card>
        <Card n={2} title={ac.defaultAddress} href="/account/addresses" cta={ac.manageAddresses}>
          {defaultAddress ? <>{defaultAddress.line1}<br />{defaultAddress.city}, {defaultAddress.postalCode}</> : accountCopy.addressesEmpty}
        </Card>
        <Card n={3} title={ac.returns} href="/account/returns" cta={ac.viewReturns}>{ac.openReturns(open)}</Card>
      </div>
    </div>
  );
}

/** "Steps band" column: top hairline, mono index, title, body, underlined link. */
function Card({ n, title, href, cta, children }: { n: number; title: string; href: string; cta: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-ink/20 pt-4">
      <span className="t-index text-ink-soft">{String(n).padStart(2, "0")}</span>
      <h2 className="t-h2">{title}</h2>
      <p className="flex-1 break-words text-body text-ink-soft">{children}</p>
      <Link href={href} className="inline-flex min-h-11 items-center self-start text-meta font-medium underline underline-offset-4">{cta} <span aria-hidden>›</span></Link>
    </section>
  );
}
