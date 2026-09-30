"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { formatDateTime } from "@/components/admin/format";
import type { Integration } from "@/data/admin/types";
import { adminApi, mutate } from "../api";

export function IntegrationsView({ integrations }: { integrations: Integration[] }) {
  const [items, setItems] = useState(integrations);
  const [testing, setTesting] = useState<string | null>(null);

  const test = async (i: Integration) => {
    setTesting(i.id);
    // TODO(backend agent): call /api/admin/integrations/<id>/test — server pings the provider with stored secrets
    const res = await adminApi<{ status: Integration["status"] }>(`integrations/${i.id}/test`, {});
    setTesting(null);
    if (!res.ok) return void toast.error(`${i.name} test failed`, { description: res.error });
    const status = res.data?.status ?? i.status;
    setItems((xs) => xs.map((x) => (x.id === i.id ? { ...x, status, lastCheckedAt: new Date().toISOString() } : x)));
    toast.success(`${i.name}: ${status.replace(/_/g, " ")}`, res.demo ? { description: "Demo result — admin API not connected yet." } : undefined);
  };
  const save = (i: Integration, patch: Record<string, string>) => {
    if (!Object.keys(patch).length) return void toast.info("No changes to save.");
    const before = items;
    setItems(items.map((x) => (x.id === i.id ? { ...x, fields: x.fields.map((f) => (f.key in patch ? { ...f, value: patch[f.key] } : f)) } : x)));
    void mutate(`integrations/${i.id}`, patch, { success: `${i.name} updated`, rollback: () => setItems(before) });
  };

  return (
    <>
      <PageHeader title="Integrations" description="Provider connections. Secrets live in server environment variables and are never shown or editable here." />
      <ul className="grid gap-6 lg:grid-cols-2">
        {items.map((i) => (
          <li key={i.id}>
            <Panel title={i.name} description={i.purpose} className="h-full"
              actions={<span className="flex gap-1.5"><Badge tone={i.environment === "live" ? "success" : "warning"}>{i.environment}</Badge><StatusBadge status={i.status} /></span>}>
              <form className="grid gap-3" onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                save(i, Object.fromEntries(i.fields.map((f) => [f.key, String(fd.get(f.key) ?? "")]).filter(([k, v]) => v !== i.fields.find((f) => f.key === k)?.value)));
              }}>
                {i.fields.map((f) => <Input key={f.key} name={f.key} label={f.label} defaultValue={f.value} />)}
                <p className="t-meta">Last checked {formatDateTime(i.lastCheckedAt)}</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" loading={testing === i.id} onClick={() => test(i)}>Test connection</Button>
                  <Button type="submit" size="sm" variant="ghost">Save</Button>
                </div>
              </form>
            </Panel>
          </li>
        ))}
      </ul>
    </>
  );
}
