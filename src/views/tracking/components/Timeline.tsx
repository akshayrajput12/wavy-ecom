import { clsx } from "clsx";
import { Check } from "lucide-react";
import { site } from "@/data/site";
import type { ShipmentStatus, TrackingEvent } from "@/types/domain";

const FLOW: { status: ShipmentStatus; label: string }[] = [
  { status: "created", label: "Order confirmed" },
  { status: "picked_up", label: "Picked up by courier" },
  { status: "in_transit", label: "In transit" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];
const when = new Intl.DateTimeFormat(site.locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

/** Vertical shipment timeline: the standard journey, with reached steps stamped from carrier events. */
export function Timeline({ status, events }: { status: ShipmentStatus; events: TrackingEvent[] }) {
  const reached = FLOW.findIndex((f) => f.status === status);
  const exception = status === "exception" || status === "cancelled" ? events.at(-1) : undefined;
  return (
    <ol className="grid">
      {FLOW.map((f, i) => {
        const ev = events.findLast((e) => e.status === f.status);
        const done = i <= reached || !!ev;
        const current = i === reached;
        return (
          <li key={f.status} className="relative flex gap-4 pb-6 last:pb-0">
            {i < FLOW.length - 1 && (
              <span className={clsx("absolute left-[11px] top-6 h-[calc(100%-1.5rem)] w-0.5", i < reached ? "bg-ink" : "bg-line")} aria-hidden />
            )}
            <span className={clsx(
              "relative grid size-6 shrink-0 place-items-center rounded-full",
              done ? "bg-ink text-on-dark" : "border-2 border-line bg-surface",
              current && "ring-4 ring-accent/40",
            )} aria-hidden>
              {done && <Check className="size-3.5" />}
            </span>
            <div className="-mt-0.5 min-w-0">
              <p className={clsx("text-body font-medium", !done && "text-ink-muted")}>
                {f.label}{current && <span className="sr-only"> (current)</span>}{!done && <span className="sr-only"> (pending)</span>}
              </p>
              {ev && (
                <p className="t-meta">
                  <time dateTime={ev.at}>{when.format(new Date(ev.at))}</time>
                  {ev.location && ` · ${ev.location}`}
                </p>
              )}
              {ev?.note && <p className="t-meta">{ev.note}</p>}
            </div>
          </li>
        );
      })}
      {exception && (
        <li role="alert" className="mt-4 rounded-sm bg-danger/10 p-3 text-body text-danger">
          Delivery issue: {exception.note ?? "The courier reported a problem. We're on it."}
        </li>
      )}
    </ol>
  );
}
