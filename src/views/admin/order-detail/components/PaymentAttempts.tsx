import { clsx } from "clsx";
import { CheckCircle2, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/Badge";
import { Panel } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import { failureStageLabels } from "@/data/admin/settings";
import type { PaymentAttempt } from "@/data/admin/types";
import { formatPrice } from "@/lib/format";

const STAGES = ["gateway_init", "customer_auth", "bank_decline", "verification"] as const;

/** Each attempt with the stage it reached; failed attempts show exactly where they stopped. */
export function PaymentAttempts({ attempts }: { attempts: PaymentAttempt[] }) {
  return (
    <Panel title="Payment attempts" description={`${attempts.length} attempt${attempts.length === 1 ? "" : "s"} · newest last`}>
      <ol className="relative flex flex-col gap-5 border-l border-line pl-6">
        {attempts.map((a, i) => {
          const failed = a.status === "failed";
          const Icon = failed ? XCircle : CheckCircle2;
          const stopAt = a.stage === "timeout" ? 1 : STAGES.indexOf(a.stage as (typeof STAGES)[number]);
          return (
            <li key={a.id} className="relative">
              <Icon className={clsx("absolute top-0.5 -left-[33px] size-4 bg-surface", failed ? "text-danger" : "text-success")} aria-hidden />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body font-medium">Attempt {i + 1}</span>
                <StatusBadge status={a.status} />
                <span className="t-meta">{a.provider} · {a.method} · {formatPrice(a.amount)} · {formatDateTime(a.at)}</span>
              </div>
              {/* stage track: gateway → customer auth → bank → verification */}
              <ol className="mt-2 flex flex-wrap gap-1.5" aria-label="Payment stages">
                {STAGES.map((s, si) => {
                  const state = !failed || si < stopAt ? "passed" : si === stopAt ? "failed" : "skipped";
                  return (
                    <li key={s} className={clsx("rounded-pill border px-2 py-0.5 text-micro",
                      state === "passed" && "border-success/30 text-success", state === "failed" && "border-danger bg-danger/10 font-medium text-danger", state === "skipped" && "border-line text-ink-muted")}>
                      {state === "passed" ? "✓ " : state === "failed" ? "✕ " : ""}{failureStageLabels[s]}
                    </li>
                  );
                })}
              </ol>
              {failed && <p className="mt-1.5 text-meta text-danger">Failed at {failureStageLabels[a.stage]}: {a.message}</p>}
              {a.reference && <p className="t-meta mt-1">Ref {a.reference}</p>}
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
