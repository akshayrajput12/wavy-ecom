import { clsx } from "clsx";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/admin/Panel";
import type { AdminDashboard } from "@/types/admin";

type Tone = "danger" | "warning" | "info";
export interface Alert { id: string; tone: Tone; title: string; body: string; href: string }

const icon = { danger: OctagonAlert, warning: AlertTriangle, info: Info } as const;
const tone = { danger: "text-danger", warning: "text-warning", info: "text-info" } as const;
const label = { danger: "Critical", warning: "Warning", info: "Info" } as const;
const s = (n: number) => (n > 1 ? "s" : "");

/** Derived from the dashboard payload (there is no alerts endpoint). */
export function buildAlerts({ lowStock, recentOrders }: AdminDashboard): Alert[] {
  const out = lowStock.filter((v) => v.available <= 0).length;
  const low = lowStock.length - out;
  const failed = recentOrders.filter((o) => o.paymentStatus === "failed").length;
  const toShip = recentOrders.filter((o) => o.status === "paid" || o.status === "processing" || o.status === "packed").length;
  const alerts: Alert[] = [];
  if (out) alerts.push({ id: "out", tone: "danger", title: `${out} variant${s(out)} out of stock`, body: "Restock or hide them from the storefront.", href: "/admin/inventory?filter=out" });
  if (low) alerts.push({ id: "low", tone: "warning", title: `${low} variant${s(low)} running low`, body: "Below their reorder threshold.", href: "/admin/inventory?filter=low" });
  if (failed) alerts.push({ id: "failed", tone: "warning", title: `${failed} recent order${s(failed)} with failed payment`, body: "Check the payment log or reconcile.", href: "/admin/payments" });
  if (toShip) alerts.push({ id: "ship", tone: "info", title: `${toShip} order${s(toShip)} to fulfil`, body: "Paid or being packed, waiting to ship.", href: "/admin/orders" });
  return alerts;
}

export function Alerts({ alerts }: { alerts: Alert[] }) {
  return (
    <Panel title="Needs attention">
      {alerts.length === 0 ? <p className="t-meta">Nothing needs attention.</p> : (
        <ul className="flex flex-col gap-3">
          {alerts.map((a) => {
            const Icon = icon[a.tone];
            return (
              <li key={a.id}>
                <Link href={a.href} className="flex gap-3 rounded-sm border border-line-soft p-3 hover:border-ink">
                  <Icon className={clsx("mt-0.5 size-4 shrink-0", tone[a.tone])} aria-hidden />
                  <span>
                    <span className="block text-body font-medium"><span className="sr-only">{label[a.tone]}: </span>{a.title}</span>
                    <span className="t-meta">{a.body}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
