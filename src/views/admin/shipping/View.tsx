"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Toggle } from "@/components/admin/Fields";
import { FormSection, PageHeader, Panel } from "@/components/admin/Panel";
import type { ShippingSettings } from "@/data/admin/types";
import { mutate } from "../api";

const rupees = z.number({ error: "Enter an amount" }).min(0);
const schema = z.object({
  provider: z.string().min(1),
  pickupAddress: z.string().trim().min(10, "Full pickup address"),
  pickupPincode: z.string().regex(/^\d{6}$/, "6-digit PIN code"),
  freeShippingThreshold: rupees, flatRate: rupees,
  codEnabled: z.boolean(), codFee: rupees, codMaxOrder: rupees,
  windows: z.array(z.object({ zone: z.string().min(2, "Required"), days: z.string().regex(/^\d+(–\d+)?$/, "e.g. 2–4") })),
  returnsCourier: z.string().min(2), returnWindowDays: z.number().int().min(0).max(60),
});
type Form = z.infer<typeof schema>;
const PAISE = ["freeShippingThreshold", "flatRate", "codFee", "codMaxOrder"] as const;

export function ShippingView({ settings }: { settings: ShippingSettings }) {
  const toForm = { ...settings, ...Object.fromEntries(PAISE.map((k) => [k, settings[k] / 100])) } as Form;
  const { register, control, handleSubmit, setValue, reset, formState: { errors, isDirty, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: toForm });
  const windows = useFieldArray({ control, name: "windows" });
  const cod = useWatch({ control, name: "codEnabled" });
  const n = { valueAsNumber: true } as const;

  const onSubmit = async (v: Form) => {
    const payload = { ...v, ...Object.fromEntries(PAISE.map((k) => [k, Math.round(v[k] * 100)])) };
    // TODO(backend agent): call /api/admin/settings/shipping (checkout reads threshold server-side)
    if (await mutate("settings/shipping", payload, { success: "Shipping settings saved" })) reset(v);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PageHeader title="Shipping" description="Courier, pickup, delivery promises, COD and returns."
        actions={<Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>} />
      <Panel>
        <FormSection title="Provider & pickup">
          <Select label="Shipping provider" {...register("provider")}><option>Shiprocket</option><option>Delhivery direct</option><option>Self-managed</option></Select>
          <Input label="Pickup PIN code" inputMode="numeric" error={errors.pickupPincode?.message} {...register("pickupPincode")} />
          <Input label="Pickup address" className="sm:col-span-2" error={errors.pickupAddress?.message} {...register("pickupAddress")} />
        </FormSection>
        <FormSection title="Rates" description="Customers see the threshold as a progress nudge in the bag.">
          <Input label="Free shipping over (₹)" type="number" min={0} error={errors.freeShippingThreshold?.message} {...register("freeShippingThreshold", n)} />
          <Input label="Flat rate below threshold (₹)" type="number" min={0} error={errors.flatRate?.message} {...register("flatRate", n)} />
        </FormSection>
        <FormSection title="Delivery windows" description="Shown on product pages and at checkout.">
          <div className="grid gap-3 sm:col-span-2">
            {windows.fields.map((f, i) => (
              <div key={f.id} className="grid items-end gap-3 sm:grid-cols-[2fr_1fr_auto]">
                <Input label={`Zone ${i + 1}`} error={errors.windows?.[i]?.zone?.message} {...register(`windows.${i}.zone`)} />
                <Input label="Business days" error={errors.windows?.[i]?.days?.message} {...register(`windows.${i}.days`)} />
                <Button type="button" size="sm" variant="ghost" className="mb-1" onClick={() => windows.remove(i)}>Remove</Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="secondary" className="justify-self-start" onClick={() => windows.append({ zone: "", days: "" })}>Add zone</Button>
          </div>
        </FormSection>
        <FormSection title="Cash on delivery">
          <div className="sm:col-span-2"><Toggle label="Offer COD" description="Hidden automatically for pincodes the courier can't serve." checked={cod} onChange={(v) => setValue("codEnabled", v, { shouldDirty: true })} /></div>
          <Input label="COD fee (₹)" type="number" min={0} readOnly={!cod} aria-disabled={!cod} {...register("codFee", n)} />
          <Input label="Max COD order (₹)" type="number" min={0} readOnly={!cod} aria-disabled={!cod} {...register("codMaxOrder", n)} />
        </FormSection>
        <FormSection title="Returns">
          <Input label="Returns courier" {...register("returnsCourier")} />
          <Input label="Return window (days)" type="number" min={0} error={errors.returnWindowDays?.message} {...register("returnWindowDays", n)} />
        </FormSection>
      </Panel>
    </form>
  );
}
