"use client";

import { Toggle } from "@/components/admin/Fields";
import { Panel } from "@/components/admin/Panel";
import type { AdminGateway } from "@/types/admin";
import { useAct } from "../../orders/components/act";

/** Enable/disable gateways and switch test/live mode. Each change saves immediately (it is a live switch). */
export function Gateways({ gateways }: { gateways: AdminGateway[] }) {
  const { busy, run } = useAct();
  const patch = (provider: string, body: object, ok: string) => void run("PATCH", `payments/gateways/${provider}`, body, ok);
  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {gateways.map((g) => {
        const s = g.stats24h;
        return (
          <Panel key={g.provider} title={g.displayName} description={g.description ?? undefined}>
            <Toggle label={g.isEnabled ? "Enabled at checkout" : "Disabled"} checked={g.isEnabled} disabled={busy}
              onChange={(v) => patch(g.provider, { isEnabled: v }, `${g.displayName} ${v ? "enabled" : "disabled"}`)} />
            {g.provider !== "cod" && (
              <label className="mt-3 flex items-center gap-2 text-meta font-medium">Mode
                <select value={g.mode} disabled={busy} onChange={(e) => patch(g.provider, { mode: e.target.value }, `${g.displayName} set to ${e.target.value}`)}
                  className="h-11 rounded-sm border border-line bg-surface px-2 text-body sm:h-9"><option value="test">test</option><option value="live">live</option></select>
              </label>
            )}
            <p className="t-meta mt-3">Last 24h: {s.attempts} attempts, {s.captured} captured, {s.failed} failed ({Math.round(s.successRate * 100)}% success)</p>
            {Object.entries(s.failuresByStage).length > 0 && (
              <p className="t-meta">Failures: {Object.entries(s.failuresByStage).map(([k, n]) => `${k} ${n}`).join(" · ")}</p>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
