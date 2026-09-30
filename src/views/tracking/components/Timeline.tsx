import { clsx } from "clsx";
import { Check, Home, Package, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { ac } from "@/views/account/copy";
import { deliverySteps, type TimelineSource } from "../timeline";

const ICONS = { placed: ShoppingBag, packed: Package, shipped: Truck, out_for_delivery: PackageCheck, delivered: Home } as const;
const when = new Intl.DateTimeFormat(siteConfig.locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** Visual delivery journey: horizontal on sm+, vertical on phones. Status is text + icon, never colour alone. */
export function Timeline({ order }: { order: TimelineSource }) {
  const steps = deliverySteps(order);
  const exception = order.shipment?.status === "exception";
  return (
    <div>
      <ol className="grid gap-0 sm:grid-cols-5">
        {steps.map((s, i) => {
          const Icon = ICONS[s.key];
          return (
            <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center">
              {i < steps.length - 1 && (
                <span aria-hidden className={clsx(
                  "absolute left-5 top-10 h-[calc(100%-2.5rem)] w-0.5 sm:left-[calc(50%+1.25rem)] sm:top-5 sm:h-0.5 sm:w-[calc(100%-2.5rem)]",
                  steps[i + 1].done ? "bg-accent-deep" : "bg-line",
                )} />
              )}
              <span aria-hidden className={clsx(
                "relative grid size-10 shrink-0 place-items-center rounded-pill transition-colors duration-(--dur-base)",
                s.done ? "bg-accent-deep text-on-dark" : "border-2 border-line bg-surface text-ink-muted",
                s.current && !exception && "ring-4 ring-accent",
              )}>
                {s.done && !s.current ? <Check className="size-4" /> : <Icon className="size-4" />}
              </span>
              <div className="min-w-0 pt-2 sm:pt-0">
                <p className={clsx("text-body font-medium", !s.done && "text-ink-muted")}>
                  {ac.steps[s.key]} <span className="sr-only">{s.current ? ac.current : !s.done ? ac.pending : ""}</span>
                </p>
                {s.at && <p className="t-meta"><time dateTime={s.at}>{when.format(new Date(s.at))}</time></p>}
              </div>
            </li>
          );
        })}
      </ol>
      {exception && <p role="alert" className="mt-5 rounded-md bg-danger/10 px-4 py-3 text-body text-danger">⚠ {ac.exception}</p>}
      {order.status === "cancelled" && <p role="status" className="mt-5 rounded-md bg-surface-warm px-4 py-3 text-body">{ac.cancelled}</p>}
    </div>
  );
}
