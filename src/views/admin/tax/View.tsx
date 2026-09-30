"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Toggle } from "@/components/admin/Fields";
import { FormSection, PageHeader, Panel } from "@/components/admin/Panel";
import type { TaxSettings } from "@/data/admin/types";
import { formatPrice } from "@/lib/format";
import { mutate } from "../api";
import { gstBreakdown } from "./components/calc";

const schema = z.object({
  gstPercent: z.number().refine((v) => [0, 5, 12, 18, 28].includes(v), "Use a GST slab: 0, 5, 12, 18 or 28"),
  inclusive: z.boolean(),
  gstin: z.string().toUpperCase().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Invalid GSTIN format"),
  legalName: z.string().trim().min(3), hsnDefault: z.string().regex(/^\d{4,8}$/, "4–8 digit HSN"), stateCode: z.string().regex(/^\d{2}$/),
});
type Form = z.infer<typeof schema>;

export function TaxView({ settings }: { settings: TaxSettings }) {
  const { register, control, handleSubmit, setValue, reset, formState: { errors, isDirty, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: settings });
  const [sample, setSample] = useState(1299);
  const [interstate, setInterstate] = useState(false);
  const [rate, inclusive] = useWatch({ control, name: ["gstPercent", "inclusive"] });
  const g = gstBreakdown(Math.round(sample * 100), Number(rate) || 0, inclusive);

  const onSubmit = async (v: Form) => {
    // TODO(backend agent): call /api/admin/settings/tax (pricing service reads this; audit-logged)
    if (await mutate("settings/tax", v, { success: "Tax settings saved" })) reset(v);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PageHeader title="Tax" description="GST configuration used for prices, invoices and the checkout tax line."
        actions={<Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel>
          <FormSection title="GST">
            <Select label="Default GST rate" error={errors.gstPercent?.message} {...register("gstPercent", { valueAsNumber: true })}>
              {[0, 5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
            </Select>
            <Input label="Default HSN code" error={errors.hsnDefault?.message} {...register("hsnDefault")} />
            <div className="sm:col-span-2">
              <Toggle label="Prices include GST" description="Indian B2C convention: listed price is what the customer pays." checked={inclusive} onChange={(v) => setValue("inclusive", v, { shouldDirty: true })} />
            </div>
          </FormSection>
          <FormSection title="Business" description="Printed on every invoice.">
            <Input label="GSTIN" error={errors.gstin?.message} {...register("gstin")} />
            <Input label="State code" error={errors.stateCode?.message} {...register("stateCode")} />
            <Input label="Legal name" className="sm:col-span-2" error={errors.legalName?.message} {...register("legalName")} />
          </FormSection>
        </Panel>
        <Panel title="Preview" description="How a price breaks down with these settings.">
          <div className="grid gap-4">
            <Input label="Listed price (₹)" type="number" min={0} value={sample} onChange={(e) => setSample(Math.max(0, Number(e.target.value)))} />
            <label className="flex items-center gap-2 text-body"><input type="checkbox" className="size-4 accent-ink" checked={interstate} onChange={(e) => setInterstate(e.target.checked)} />Ship to another state (IGST)</label>
            <dl className="grid gap-1.5 border-t border-line pt-3 text-body" aria-live="polite">
              <Row k="Taxable value" v={formatPrice(g.base)} />
              {interstate ? <Row k={`IGST ${rate}%`} v={formatPrice(g.tax)} /> : <>
                <Row k={`CGST ${Number(rate) / 2}%`} v={formatPrice(g.cgst)} />
                <Row k={`SGST ${Number(rate) / 2}%`} v={formatPrice(g.sgst)} />
              </>}
              <div className="flex justify-between border-t border-line pt-1.5 font-semibold"><dt>Customer pays</dt><dd className="tabular-nums">{formatPrice(g.total)}</dd></div>
            </dl>
          </div>
        </Panel>
      </div>
    </form>
  );
}

const Row = ({ k, v }: { k: string; v: string }) => <div className="flex justify-between text-ink-soft"><dt>{k}</dt><dd className="tabular-nums">{v}</dd></div>;
