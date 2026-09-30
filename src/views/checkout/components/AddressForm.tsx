"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { INDIAN_STATES } from "@/data/checkout";
import { addressSchema, type AddressValues } from "../schema";

type Props = {
  defaultValues?: Partial<AddressValues>;
  onSubmit: (values: AddressValues) => void | Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
  showDefaultToggle?: boolean;
};

/** Indian address form (6-digit pincode, state list). Shared by checkout + account addresses. */
export function AddressForm({ defaultValues, onSubmit, submitLabel, onCancel, showDefaultToggle }: Props) {
  const sid = useId();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    mode: "onTouched",
    defaultValues: { line2: "", ...defaultValues },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <Input label="Full name" autoComplete="name" className="sm:col-span-2" error={errors.name?.message} {...register("name")} />
      <Input label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
        className="sm:col-span-2" hint="For delivery updates only" error={errors.phone?.message} {...register("phone")} />
      <Input label="House no., building, street" autoComplete="address-line1" className="sm:col-span-2"
        error={errors.line1?.message} {...register("line1")} />
      <Input label="Area, landmark (optional)" autoComplete="address-line2" className="sm:col-span-2" {...register("line2")} />
      <Input label="Pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6}
        error={errors.postalCode?.message} {...register("postalCode")} />
      <Input label="City" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor={sid} className="text-meta font-medium text-ink">State</label>
        <select
          id={sid}
          autoComplete="address-level1"
          aria-invalid={!!errors.state}
          aria-describedby={errors.state ? `${sid}-msg` : undefined}
          className={clsx(
            "h-11 rounded-sm border bg-surface px-3 text-body text-ink focus:border-ink focus:outline-none",
            errors.state ? "border-danger" : "border-line",
          )}
          defaultValue=""
          {...register("state")}
        >
          <option value="" disabled>Select state</option>
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {errors.state && <p id={`${sid}-msg`} className="text-meta text-danger">⚠ {errors.state.message}</p>}
      </div>
      {showDefaultToggle && (
        <label className="flex min-h-11 items-center gap-3 text-body sm:col-span-2">
          <input type="checkbox" className="size-4 accent-ink" {...register("isDefault")} /> Make this my default address
        </label>
      )}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
