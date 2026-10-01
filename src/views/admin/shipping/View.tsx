"use client";

import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { SETTINGS_SECTIONS } from "@/backend/admin/schemas/settings";
import { formatPrice } from "@/lib/format";
import type { AdminShippingZone, AdminStoreSettings } from "@/types/admin";
import { EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";
import { BulkBar, RemoveButton, SelectBox, useCanRemove, useSelection } from "../_kit/Remove";
import { paise, rupees } from "./money";

function RatesForm({ s }: { s: AdminStoreSettings }) {
  const { v, set, errors, busy, save } = useEditor({
    freeShippingThreshold: s.freeShippingThreshold === null ? "" : rupees(s.freeShippingThreshold), flatShippingFee: rupees(s.flatShippingFee),
    codEnabled: s.codEnabled, codFee: rupees(s.codFee), codMaxOrderAmount: s.codMaxOrderAmount === null ? "" : rupees(s.codMaxOrderAmount),
  }, { schema: SETTINGS_SECTIONS.shipping.schema, back: "/admin/shipping" });
  const submit = () => save("PATCH", "settings/shipping", {
    freeShippingThreshold: v.freeShippingThreshold.trim() ? paise(v.freeShippingThreshold) : null, flatShippingFee: paise(v.flatShippingFee),
    codEnabled: v.codEnabled, codFee: paise(v.codFee), codMaxOrderAmount: v.codMaxOrderAmount.trim() ? paise(v.codMaxOrderAmount) : null,
  }, "Shipping rates saved");
  const f = (k: "freeShippingThreshold" | "flatShippingFee" | "codFee" | "codMaxOrderAmount", label: string, hint?: string) =>
    <Input label={`${label} (INR)`} hint={hint} type="number" step="0.01" min="0" value={v[k]} error={errors[k]} onChange={(e) => set(k, e.target.value)} />;
  return (
    <EditorForm onSave={submit} busy={busy} back="/admin/shipping">
      <Panel title="Rates and cash on delivery">
        <div className="grid gap-4 sm:grid-cols-2">
          {f("flatShippingFee", "Flat shipping fee")}
          {f("freeShippingThreshold", "Free shipping above", "Leave empty for never")}
          <label className="flex min-h-11 items-center gap-2 text-body sm:col-span-2"><input type="checkbox" className="size-4 accent-ink" checked={v.codEnabled} onChange={(e) => set("codEnabled", e.target.checked)} />Cash on delivery enabled</label>
          {f("codFee", "COD fee")}
          {f("codMaxOrderAmount", "COD max order", "Leave empty for no limit")}
        </div>
      </Panel>
    </EditorForm>
  );
}

export function ShippingView({ settings, zones }: { settings: AdminStoreSettings | null; zones: AdminShippingZone[] }) {
  const zoneSel = useSelection();
  const methodSel = useSelection();
  const canDelete = useCanRemove("shipping-zones");
  return (
    <>
      <PageHeader title="Shipping" description="Store-wide rates, delivery zones and the methods offered in each." />
      {settings ? <RatesForm s={settings} /> : <p className="mb-6 text-body text-ink-soft">Store settings are unavailable. Check the Supabase connection.</p>}
      <div className="mt-10 mb-3 flex flex-wrap items-center justify-between gap-3"><h2 className="t-h3">Zones</h2><ButtonLink size="sm" href="/admin/shipping/zones/new">New zone</ButtonLink></div>
      {canDelete && <>
        <BulkBar count={zoneSel.ids.length} onClear={zoneSel.clear}><RemoveButton noun="shipping-zones" ids={zoneSel.ids} onDone={zoneSel.clear} /></BulkBar>
        <BulkBar count={methodSel.ids.length} onClear={methodSel.clear}><RemoveButton noun="shipping-methods" ids={methodSel.ids} onDone={methodSel.clear} /></BulkBar>
      </>}
      <div className="grid gap-4">
        {zones.length === 0 && <p className="text-body text-ink-soft">No zones yet.</p>}
        {zones.map((z) => (
          <Panel key={z.id} title={z.name} description={z.isDefault ? "Default zone" : `${z.states.length} states`}
            actions={<div className="flex flex-wrap items-center gap-2">
              {!z.isActive && <Badge>Inactive</Badge>}<ButtonLink size="sm" variant="secondary" href={`/admin/shipping/zones/${z.id}/edit`}>Edit zone</ButtonLink>
              {canDelete && <SelectBox checked={zoneSel.has(z.id)} onChange={() => zoneSel.toggle(z.id)} label={`zone ${z.name}`} />}
              <RemoveButton compact noun="shipping-zones" ids={[z.id]} name={`zone ${z.name}`} />
            </div>}>
            <ul className="divide-y divide-line-soft text-body">
              {z.methods.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-2 py-2">
                  {canDelete && <SelectBox checked={methodSel.has(m.id)} onChange={() => methodSel.toggle(m.id)} label={`method ${m.name}`} />}
                  <Link href={`/admin/shipping/methods/${m.id}/edit`} className="font-medium underline-offset-4 hover:underline">{m.name}</Link>
                  <span className="ml-auto text-ink-soft">{formatPrice(m.rate)} · {m.minDays}-{m.maxDays} days {m.isActive ? "" : "· Inactive"}</span>
                  <RemoveButton compact noun="shipping-methods" ids={[m.id]} name={`method ${m.name}`} />
                </li>
              ))}
            </ul>
            <div className="mt-3"><ButtonLink size="sm" variant="ghost" href={`/admin/shipping/methods/new?zoneId=${z.id}`}>Add method</ButtonLink></div>
          </Panel>
        ))}
      </div>
    </>
  );
}
