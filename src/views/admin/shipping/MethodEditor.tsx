"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/admin/Fields";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { ShippingMethodSchema } from "@/backend/admin/schemas/settings";
import type { AdminShippingMethod, AdminShippingZone } from "@/types/admin";
import { BackLink, DeleteButton, EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";
import { paise, rupees } from "./money";

export function MethodEditorView({ method, zones, zoneId }: { method: AdminShippingMethod | null; zones: AdminShippingZone[]; zoneId?: string }) {
  const { v, set, errors, busy, save, remove } = useEditor({
    zoneId: method?.zoneId ?? zoneId ?? zones[0]?.id ?? "", code: method?.code ?? "", name: method?.name ?? "", description: method?.description ?? "",
    rate: rupees(method?.rate ?? 0), freeAbove: method?.freeAbove == null ? "" : rupees(method.freeAbove), codAvailable: method?.codAvailable ?? true,
    minDays: String(method?.minDays ?? 3), maxDays: String(method?.maxDays ?? 7), isActive: method?.isActive ?? true, sortOrder: String(method?.sortOrder ?? 0),
  }, { schema: ShippingMethodSchema, back: "/admin/shipping" });
  const submit = () => save(method ? "PATCH" : "POST", method ? `shipping-methods/${method.id}` : "shipping-methods", {
    zoneId: v.zoneId, code: v.code, name: v.name, description: v.description.trim() || null, rate: paise(v.rate),
    freeAbove: v.freeAbove.trim() ? paise(v.freeAbove) : null, codAvailable: v.codAvailable, minDays: Number(v.minDays), maxDays: Number(v.maxDays),
    isActive: v.isActive, sortOrder: Number(v.sortOrder) || 0,
  }, "Method saved");
  const f = (k: "code" | "name" | "description" | "rate" | "freeAbove" | "minDays" | "maxDays" | "sortOrder", label: string, type = "text", hint?: string) =>
    <Input label={label} type={type} hint={hint} step={type === "number" ? "any" : undefined} value={v[k]} error={errors[k]} onChange={(e) => set(k, e.target.value)} />;
  return (
    <>
      <BackLink href="/admin/shipping">Shipping</BackLink>
      <PageHeader title={method ? "Edit method" : "New method"} />
      <EditorForm onSave={submit} busy={busy} back="/admin/shipping"
        danger={method && <DeleteButton busy={busy} onConfirm={() => void remove(`shipping-methods/${method.id}`, "Method deleted")} />}>
        <Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Zone" value={v.zoneId} error={errors.zoneId} onChange={(e) => set("zoneId", e.target.value)}>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </Select>
            {f("name", "Name")}
            {f("code", "Code", "text", "Lowercase letters, numbers, underscores")}
            {f("description", "Description")}
            {f("rate", "Rate (INR)", "number")}
            {f("freeAbove", "Free above (INR)", "number", "Leave empty for never")}
            {f("minDays", "Min delivery days", "number")}
            {f("maxDays", "Max delivery days", "number")}
            {f("sortOrder", "Sort order", "number")}
            <div className="grid content-end gap-1">
              <label className="flex min-h-11 items-center gap-2 text-body"><input type="checkbox" className="size-4 accent-ink" checked={v.codAvailable} onChange={(e) => set("codAvailable", e.target.checked)} />COD available</label>
              <label className="flex min-h-11 items-center gap-2 text-body"><input type="checkbox" className="size-4 accent-ink" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} />Active</label>
            </div>
          </div>
        </Panel>
      </EditorForm>
    </>
  );
}
