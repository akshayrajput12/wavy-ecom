"use client";

import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/admin/Fields";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { ShippingZoneSchema } from "@/backend/admin/schemas/settings";
import type { AdminShippingZone } from "@/types/admin";
import { BackLink, DeleteButton, EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";

export function ZoneEditorView({ zone }: { zone: AdminShippingZone | null }) {
  const { v, set, errors, busy, save, remove } = useEditor({
    name: zone?.name ?? "", states: (zone?.states ?? []).join(", "), isDefault: zone?.isDefault ?? false, isActive: zone?.isActive ?? true,
  }, { schema: ShippingZoneSchema, back: "/admin/shipping" });
  const submit = () => save(zone ? "PATCH" : "POST", zone ? `shipping-zones/${zone.id}` : "shipping-zones",
    { name: v.name, states: v.states.split(",").map((s) => s.trim()).filter(Boolean), isDefault: v.isDefault, isActive: v.isActive }, "Zone saved");
  return (
    <>
      <BackLink href="/admin/shipping">Shipping</BackLink>
      <PageHeader title={zone ? "Edit zone" : "New zone"} />
      <EditorForm onSave={submit} busy={busy} back="/admin/shipping"
        danger={zone && <DeleteButton busy={busy} onConfirm={() => void remove(`shipping-zones/${zone.id}`, "Zone deleted")} />}>
        <Panel>
          <div className="grid gap-4">
            <Input label="Zone name" value={v.name} error={errors.name} onChange={(e) => set("name", e.target.value)} />
            <Textarea label="States" hint="Comma separated, e.g. Karnataka, Maharashtra" value={v.states} error={errors.states} onChange={(e) => set("states", e.target.value)} />
            <label className="flex min-h-11 items-center gap-2 text-body"><input type="checkbox" className="size-4 accent-ink" checked={v.isDefault} onChange={(e) => set("isDefault", e.target.checked)} />Default zone (used when no state matches)</label>
            <label className="flex min-h-11 items-center gap-2 text-body"><input type="checkbox" className="size-4 accent-ink" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} />Active</label>
          </div>
        </Panel>
      </EditorForm>
    </>
  );
}
