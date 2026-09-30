import { Panel } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import type { OrderEvent } from "@/data/admin/types";

export function Timeline({ events }: { events: OrderEvent[] }) {
  return (
    <Panel title="Status timeline">
      <ol className="flex flex-col gap-3 border-l border-line pl-4">
        {events.map((e, i) => (
          <li key={i} className="relative text-body">
            <span className="absolute top-2 -left-[21px] size-2 rounded-full bg-ink" aria-hidden />
            <span className="font-medium">{e.label}</span>
            <span className="t-meta block">{formatDateTime(e.at)} · {e.actor}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
