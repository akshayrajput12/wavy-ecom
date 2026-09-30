import { clsx } from "clsx";
import { AlertTriangle, Info, OctagonAlert } from "lucide-react";
import Link from "next/link";
import { Panel } from "@/components/admin/Panel";
import type { Alert } from "@/data/admin/types";

const icon = { danger: OctagonAlert, warning: AlertTriangle, info: Info } as const;
const tone = { danger: "text-danger", warning: "text-warning", info: "text-info" } as const;
const label = { danger: "Critical", warning: "Warning", info: "Info" } as const;

export function Alerts({ alerts }: { alerts: Alert[] }) {
  return (
    <Panel title="Needs attention">
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
    </Panel>
  );
}
