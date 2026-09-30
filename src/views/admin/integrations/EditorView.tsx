"use client";

import { Select, Textarea } from "@/components/admin/Fields";
import { DefinitionList, PageHeader, Panel } from "@/components/admin/Panel";
import { IntegrationPatchSchema } from "@/backend/admin/schemas/settings";
import type { AdminIntegration } from "@/types/admin";
import { BackLink, EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";

export function IntegrationEditorView({ item }: { item: AdminIntegration }) {
  const { v, set, errors, busy, save } = useEditor({
    isActive: item.isActive, environment: item.environment as "test" | "live", status: item.status as "connected" | "needs_attention" | "disconnected",
    config: JSON.stringify(item.config ?? {}, null, 2), jsonError: "",
  }, { schema: IntegrationPatchSchema, back: "/admin/integrations" });
  const submit = () => {
    let config: unknown;
    try { config = JSON.parse(v.config); } catch { set("jsonError", "Config must be valid JSON"); return; }
    if (!config || typeof config !== "object" || Array.isArray(config)) { set("jsonError", "Config must be a JSON object"); return; }
    set("jsonError", "");
    return save("PATCH", `integrations/${item.id}`, { isActive: v.isActive, environment: v.environment, status: v.status, config }, "Integration saved");
  };
  return (
    <>
      <BackLink href="/admin/integrations">Integrations</BackLink>
      <PageHeader title={item.provider} description="Config holds non-secret values only; keys that look like secrets are rejected." />
      <EditorForm onSave={submit} busy={busy} back="/admin/integrations">
        <Panel title="Connection">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Environment" value={v.environment} error={errors.environment} onChange={(e) => set("environment", e.target.value as typeof v.environment)}><option value="test">Test</option><option value="live">Live</option></Select>
            <Select label="Status" value={v.status} error={errors.status} onChange={(e) => set("status", e.target.value as typeof v.status)}>
              <option value="connected">Connected</option><option value="needs_attention">Needs attention</option><option value="disconnected">Disconnected</option>
            </Select>
            <label className="flex min-h-11 items-center gap-2 text-body"><input type="checkbox" className="size-4 accent-ink" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} />Enabled</label>
          </div>
          <div className="mt-4"><DefinitionList items={[
            { label: "Secret name", value: item.secretRef ?? "None" },
            { label: "Last error", value: item.lastError ?? "None" },
          ]} /></div>
        </Panel>
        <Panel title="Config (JSON)">
          <Textarea label="Non-secret settings" className="min-h-48 font-mono" value={v.config} error={v.jsonError || errors.config} onChange={(e) => set("config", e.target.value)} />
        </Panel>
      </EditorForm>
    </>
  );
}
