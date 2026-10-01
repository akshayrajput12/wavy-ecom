"use client";

import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/admin/Fields";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { SETTINGS_SECTIONS } from "@/backend/admin/schemas/settings";
import { formatPrice } from "@/lib/format";
import type { AdminStoreSettings } from "@/types/admin";
import { EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";
import { gstBreakdown } from "./components/calc";

const SAMPLE = 112000; // paise, preview only

export function TaxView({ settings }: { settings: AdminStoreSettings | null }) {
  const { v, set, errors, busy, save } = useEditor({
    taxPercentage: String(settings?.taxPercentage ?? 0), taxInclusive: settings?.taxInclusive ?? true, gstNumber: settings?.gstNumber ?? "",
    legalName: settings?.legalName ?? "", registeredAddress: settings?.registeredAddress ?? "",
  }, { schema: SETTINGS_SECTIONS.tax.schema, back: "/admin/tax" });
  if (!settings) return <><PageHeader title="Tax" /><p className="text-body text-ink-soft">Store settings are unavailable. Check the Supabase connection.</p></>;
  const rate = Number(v.taxPercentage) || 0;
  const b = gstBreakdown(SAMPLE, rate, v.taxInclusive);
  const submit = () => save("PATCH", "settings/tax", {
    taxPercentage: rate, taxInclusive: v.taxInclusive, gstNumber: v.gstNumber.trim().toUpperCase() || null,
    legalName: v.legalName.trim() || null, registeredAddress: v.registeredAddress.trim() || null,
  }, "Tax settings saved");
  return (
    <>
      <PageHeader title="Tax" description="GST applied at checkout. The server computes the final amounts." />
      <EditorForm onSave={submit} busy={busy} back="/admin/tax">
        <Panel title="GST">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="GST rate (%)" type="number" step="0.01" value={v.taxPercentage} error={errors.taxPercentage} onChange={(e) => set("taxPercentage", e.target.value)} />
            <Input label="GSTIN" hint="15 characters" value={v.gstNumber} error={errors.gstNumber} onChange={(e) => set("gstNumber", e.target.value)} />
            <label className="flex min-h-11 items-center gap-2 text-body sm:col-span-2"><input type="checkbox" className="size-4 accent-ink" checked={v.taxInclusive} onChange={(e) => set("taxInclusive", e.target.checked)} />Prices already include tax</label>
          </div>
        </Panel>
        <Panel title="Invoice seller details" description="Printed on every GST invoice. Issued invoices keep the details they were issued with.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Legal business name" hint="As on the GST registration" value={v.legalName} error={errors.legalName} onChange={(e) => set("legalName", e.target.value)} />
            <Textarea label="Registered address" hint="One line per row" rows={3} value={v.registeredAddress} error={errors.registeredAddress} onChange={(e) => set("registeredAddress", e.target.value)} />
          </div>
        </Panel>
        <Panel title="Preview" description={`On a ${formatPrice(SAMPLE)} item`}>
          <dl className="grid max-w-xs grid-cols-2 gap-2 text-body">
            <dt className="text-ink-soft">Base</dt><dd className="text-right">{formatPrice(b.base)}</dd>
            <dt className="text-ink-soft">CGST</dt><dd className="text-right">{formatPrice(b.cgst)}</dd>
            <dt className="text-ink-soft">SGST</dt><dd className="text-right">{formatPrice(b.sgst)}</dd>
            <dt className="font-medium">Total</dt><dd className="text-right font-medium">{formatPrice(b.total)}</dd>
          </dl>
        </Panel>
      </EditorForm>
    </>
  );
}
