"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { BarList } from "@/components/admin/Bars";
import { Toggle } from "@/components/admin/Fields";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { useCan } from "@/components/admin/useRole";
import { formatNumber } from "@/components/admin/format";
import { failureStageLabels } from "@/data/admin/settings";
import type { Gateway } from "@/data/admin/types";
import { mutate } from "../api";

export function PaymentsView({ gateways }: { gateways: Gateway[] }) {
  const [items, setItems] = useState(gateways);
  const canManage = useCan("payments.gateway.manage");

  const update = (id: Gateway["id"], patch: (g: Gateway) => Partial<Gateway>, label: string, all = false) => {
    const before = items;
    setItems(items.map((g) => (g.id === id ? { ...g, ...patch(g) } : all ? { ...g, isDefault: false } : g)));
    // TODO(backend agent): call /api/admin/payments/gateways (secrets stay server-side; writes audit log)
    void mutate(`payments/gateways/${id}`, patch(items.find((g) => g.id === id)!), { success: label, rollback: () => setItems(before) });
  };

  const toggle = (g: Gateway, enabled: boolean) => {
    if (!enabled && g.isDefault) return void toast.error("Pick another default gateway before disabling this one.");
    if (!enabled && items.filter((x) => x.enabled).length === 1) return void toast.error("At least one payment method must stay enabled.");
    update(g.id, () => ({ enabled }), `${g.name} ${enabled ? "enabled" : "disabled"}`);
  };
  const setMode = (g: Gateway, mode: Gateway["mode"]) => {
    if (mode === "live" && !window.confirm(`Switch ${g.name} to LIVE? Real customer payments will be charged.`)) return;
    update(g.id, () => ({ mode }), `${g.name} switched to ${mode} mode`);
  };

  return (
    <>
      <PageHeader title="Payments" description="Gateways, modes and last-24h health. Keys are managed in Integrations and never shown here." />
      <div className="grid gap-6 xl:grid-cols-3">
        {items.map((g) => {
          const failed = Object.values(g.failures).reduce((a, b) => a + b, 0);
          return (
            <Panel key={g.id} title={g.name} actions={<span className="flex gap-1.5">{g.isDefault && <Badge tone="dark">Default</Badge>}<Badge tone={g.mode === "live" ? "success" : "warning"} dot>{g.mode} mode</Badge></span>}>
              <div className="flex flex-col gap-4">
                <Toggle label="Enabled at checkout" checked={g.enabled} onChange={(v) => toggle(g, v)} disabled={!canManage} />
                <fieldset disabled={!canManage} className="disabled:opacity-50">
                  <legend className="mb-1.5 text-meta font-medium">Mode</legend>
                  <div className="inline-flex rounded-pill border border-line p-0.5">
                    {(["test", "live"] as const).map((m) => (
                      <button key={m} type="button" aria-pressed={g.mode === m} onClick={() => g.mode !== m && setMode(g, m)}
                        className={g.mode === m ? "h-8 rounded-pill bg-ink px-4 text-meta text-on-dark" : "h-8 rounded-pill px-4 text-meta hover:bg-surface-warm"}>{m}</button>
                    ))}
                  </div>
                </fieldset>
                <label className="flex items-center gap-2 text-body">
                  <input type="radio" name="default-gateway" checked={g.isDefault} disabled={!g.enabled || !canManage} className="size-4 accent-ink"
                    onChange={() => update(g.id, () => ({ isDefault: true }), `${g.name} is now the default`, true)} />
                  Default gateway
                </label>
                <div>
                  <p className="mb-1.5 text-meta font-medium">Supported methods</p>
                  <ul className="flex flex-wrap gap-1.5">{g.methods.map((m) => <li key={m}><Badge>{m}</Badge></li>)}</ul>
                </div>
                <div className="rounded-sm bg-canvas p-3">
                  <p className="t-overline text-ink-soft">Last 24 hours</p>
                  <p className="mt-1 text-h3 font-semibold tabular-nums">{g.successRate24h}% <span className="text-meta font-normal text-ink-soft">success · {formatNumber(g.attempts24h)} attempts</span></p>
                  <p className="t-meta mt-3 mb-2">Failures by stage ({failed})</p>
                  <BarList items={(Object.keys(g.failures) as (keyof Gateway["failures"])[]).map((k) => ({ label: failureStageLabels[k], value: g.failures[k], display: String(g.failures[k]) }))} />
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </>
  );
}
