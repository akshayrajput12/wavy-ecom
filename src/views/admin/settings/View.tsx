"use client";

import { Input } from "@/components/ui/Input";
import { PageHeader, Panel } from "@/components/admin/Panel";
import { SETTINGS_SECTIONS } from "@/backend/admin/schemas/settings";
import type { AdminStoreSettings } from "@/types/admin";
import { EditorForm } from "../_kit/Chrome";
import { useEditor } from "../_kit/useEditor";

export function SettingsView({ settings }: { settings: AdminStoreSettings | null }) {
  const s = settings;
  const { v, set, errors, busy, save } = useEditor({
    storeName: s?.storeName ?? "", currency: s?.currency ?? "INR", locale: s?.locale ?? "en-IN", timezone: s?.timezone ?? "Asia/Kolkata",
    returnWindowDays: String(s?.returnWindowDays ?? 7), reservationTtlMinutes: String(s?.reservationTtlMinutes ?? 15),
    lowStockDefault: String(s?.lowStockDefault ?? 5), supportEmail: s?.supportEmail ?? "", supportPhone: s?.supportPhone ?? "",
  }, { schema: SETTINGS_SECTIONS.general.schema, back: "/admin/settings" });
  const text = (k: keyof typeof v, label: string, hint?: string, type = "text") =>
    <Input label={label} hint={hint} type={type} value={v[k]} error={errors[k]} onChange={(e) => set(k, e.target.value)} />;

  if (!s) return <><PageHeader title="Settings" /><p className="text-body text-ink-soft">Store settings are unavailable. Check the Supabase connection.</p></>;
  const submit = () => save("PATCH", "settings/general", {
    storeName: v.storeName, currency: v.currency.toUpperCase(), locale: v.locale, timezone: v.timezone,
    returnWindowDays: Number(v.returnWindowDays), reservationTtlMinutes: Number(v.reservationTtlMinutes), lowStockDefault: Number(v.lowStockDefault),
    supportEmail: v.supportEmail.trim() || null, supportPhone: v.supportPhone.trim() || null,
  }, "Settings saved");
  return (
    <>
      <PageHeader title="Settings" description="Store identity and operational defaults. Tax and shipping have their own pages." />
      <EditorForm onSave={submit} busy={busy} back="/admin/settings">
        <Panel title="Store">
          <div className="grid gap-4 sm:grid-cols-2">
            {text("storeName", "Store name")}
            {text("currency", "Currency code", "3-letter ISO code, e.g. INR")}
            {text("locale", "Locale", "e.g. en-IN")}
            {text("timezone", "Timezone", "IANA name, e.g. Asia/Kolkata")}
          </div>
        </Panel>
        <Panel title="Operations">
          <div className="grid gap-4 sm:grid-cols-3">
            {text("returnWindowDays", "Return window (days)", "0 to 90", "number")}
            {text("reservationTtlMinutes", "Stock hold (minutes)", "How long checkout holds stock", "number")}
            {text("lowStockDefault", "Low-stock threshold", undefined, "number")}
          </div>
        </Panel>
        <Panel title="Support contact">
          <div className="grid gap-4 sm:grid-cols-2">
            {text("supportEmail", "Support email", undefined, "email")}
            {text("supportPhone", "Support phone")}
          </div>
        </Panel>
      </EditorForm>
    </>
  );
}
