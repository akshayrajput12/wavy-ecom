import { clsx } from "clsx";
import { Check } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { ac } from "@/views/account/copy";
import { deliverySteps, type TimelineSource } from "../timeline";

const when = new Intl.DateTimeFormat(siteConfig.locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/**
 * Delivery journey: horizontal on sm+, vertical on phones. Mono step numbers (done = check on ink),
 * status is text + mark, never colour alone.
 */
export function Timeline({ order }: { order: TimelineSource }) {
  const steps = deliverySteps(order);
  const exception = order.shipment?.status === "exception";
  return (
    <div>
      <ol className="grid gap-0 sm:grid-cols-5">
        {steps.map((s, i) => (
          <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0 sm:flex-col sm:gap-3 sm:pb-0">
            {i < steps.length - 1 && (
              <span aria-hidden className={clsx(
                "absolute left-5 top-10 h-[calc(100%-2.5rem)] w-px sm:left-10 sm:top-5 sm:h-px sm:w-[calc(100%-2.5rem)]",
                steps[i + 1].done ? "bg-ink" : "bg-line",
              )} />
            )}
            <span aria-hidden className={clsx(
              "t-index relative grid size-10 shrink-0 place-items-center rounded-pill transition-colors duration-(--dur-base)",
              s.done ? "bg-ink text-canvas" : "border border-line bg-surface text-ink-muted",
              s.current && !exception && "ring-4 ring-surface-2",
            )}>
              {s.done && !s.current ? <Check className="size-4" /> : String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 pt-2 sm:pt-0 sm:pr-3">
              <p className={clsx("text-body", s.current ? "font-semibold" : "font-medium", !s.done && "text-ink-muted")}>
                {ac.steps[s.key]} <span className="sr-only">{s.current ? ac.current : !s.done ? ac.pending : ""}</span>
              </p>
              {s.at && <p className="t-meta"><time dateTime={s.at}>{when.format(new Date(s.at))}</time></p>}
            </div>
          </li>
        ))}
      </ol>
      {exception && <p role="alert" className="mt-6 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-body text-danger">⚠ {ac.exception}</p>}
      {order.status === "cancelled" && <p role="status" className="mt-6 rounded-md bg-surface-warm px-4 py-3 text-body">{ac.cancelled}</p>}
    </div>
  );
}
