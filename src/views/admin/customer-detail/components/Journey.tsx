import { Panel } from "@/components/admin/Panel";
import type { JourneyEntry } from "@/types/admin";
import { fmtDateTime } from "../../orders/components/fmt";

/** Chronological journey (get_customer_journey). null = viewer lacks journey.read. */
export function Journey({ entries }: { entries: JourneyEntry[] | null }) {
  return (
    <Panel title="Journey" description="Orders, payments, returns and support events">
      {entries === null ? <p className="t-meta">You do not have access to the customer journey.</p>
        : entries.length === 0 ? <p className="t-meta">No activity recorded yet.</p> : (
          <ol className="flex flex-col gap-3">
            {entries.map((e, i) => (
              <li key={`${e.occurredAt}-${i}`} className="border-l-2 border-line pl-3 text-body">
                <span className="font-medium">{e.kind.replace(/_/g, " ")}</span> · {e.summary}
                <span className="t-meta block">{fmtDateTime(e.occurredAt)}</span>
              </li>
            ))}
          </ol>
        )}
    </Panel>
  );
}
