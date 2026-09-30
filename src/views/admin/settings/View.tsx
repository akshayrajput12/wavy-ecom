"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select, Textarea } from "@/components/admin/Fields";
import { FormSection, PageHeader, Panel } from "@/components/admin/Panel";
import type { StoreSettings } from "@/data/admin/types";
import { mutate } from "../api";

const schema = z.object({
  name: z.string().trim().min(2, "Store name is required"),
  supportEmail: z.email("Enter a valid email"),
  supportPhone: z.string().regex(/^\+?[\d\s-]{8,16}$/, "Enter a valid phone number"),
  address: z.string().trim().min(10, "Full registered address"),
  currency: z.string(), locale: z.string(), timezone: z.string(),
  lowStockThreshold: z.number().int().min(0).max(1000),
});
type Form = z.infer<typeof schema>;

export function SettingsView({ settings }: { settings: StoreSettings }) {
  const { register, handleSubmit, reset, formState: { errors, isDirty, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: settings });
  const onSubmit = async (v: Form) => {
    // TODO(backend agent): call /api/admin/settings/store
    if (await mutate("settings/store", v, { success: "Store settings saved" })) reset(v);
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PageHeader title="Settings" description="Store identity, contact details and regional defaults."
        actions={<Button type="submit" size="sm" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>} />
      <Panel>
        <FormSection title="Store" description="Shown in emails, invoices and the footer.">
          <Input label="Store name" error={errors.name?.message} {...register("name")} />
          <Input label="Support email" type="email" error={errors.supportEmail?.message} {...register("supportEmail")} />
          <Input label="Support phone" type="tel" error={errors.supportPhone?.message} {...register("supportPhone")} />
          <Textarea label="Registered address" wrapperClassName="sm:col-span-2" error={errors.address?.message} {...register("address")} />
        </FormSection>
        <FormSection title="Region" description="v1 ships for India; other markets come later.">
          <Select label="Currency" {...register("currency")}><option value="INR">INR — Indian rupee</option></Select>
          <Select label="Locale" {...register("locale")}><option value="en-IN">English (India)</option></Select>
          <Select label="Timezone" {...register("timezone")}><option value="Asia/Kolkata">Asia/Kolkata (IST)</option></Select>
        </FormSection>
        <FormSection title="Inventory">
          <Input label="Low stock threshold (units)" type="number" min={0} error={errors.lowStockThreshold?.message} {...register("lowStockThreshold", { valueAsNumber: true })} />
        </FormSection>
      </Panel>
    </form>
  );
}
