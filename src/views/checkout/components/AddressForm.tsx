"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { clsx } from "clsx";
import { useEffect, useId, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { INDIAN_STATES } from "@/data/copy";
import { co } from "../copy";
import { addressSchema, type AddressValues } from "../schema";
import { usePincode } from "./usePincode";

type Props = {
  defaultValues?: Partial<AddressValues>;
  onSubmit: (values: AddressValues) => void | Promise<void>;
  submitLabel: string;
  onCancel?: () => void;
  showDefaultToggle?: boolean;
  /** Autosave / dependent UI (shipping options by state). */
  onChange?: (values: Partial<AddressValues>) => void;
  /** Rendered above the submit button (checkout: delivery speed, save address). */
  children?: ReactNode;
};

const a = co.address;

/** Indian address form with pincode -> city/state autofill and a delivery check. Checkout + account addresses. */
export function AddressForm({ defaultValues, onSubmit, submitLabel, onCancel, showDefaultToggle, onChange, children }: Props) {
  const sid = useId();
  const { register, handleSubmit, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema), mode: "onTouched", defaultValues,
  });
  const pin = watch("postalCode");
  const { info, loading } = usePincode(pin?.trim());

  useEffect(() => { if (!onChange) return; const s = watch((v) => onChange(v)); return () => s.unsubscribe(); }, [watch, onChange]);
  useEffect(() => {
    if (!info) return;
    if (info.city && !getValues("city")) setValue("city", info.city, { shouldValidate: true, shouldDirty: true });
    if (info.state && !getValues("state")) setValue("state", info.state, { shouldValidate: true, shouldDirty: true });
  }, [info, getValues, setValue]);

  const s = info?.service;
  const pinHint = loading ? a.checking
    : s && !s.serviceable ? undefined
    : s ? [s.estimatedDays && a.eta(co.delivery.days(s.estimatedDays.min, s.estimatedDays.max)), s.codAvailable ? a.cod : a.noCod].filter(Boolean).join(" · ")
    : a.pincodeHint;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <Input label={a.name} autoComplete="name" error={errors.name?.message} {...register("name")} />
      <Input label={a.phone} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={13} error={errors.phone?.message} {...register("phone")} />
      <div className="sm:col-span-2">
        <Input label={a.pincode} inputMode="numeric" autoComplete="postal-code" maxLength={6} className="sm:max-w-[50%]"
          hint={pinHint} error={errors.postalCode?.message ?? (s && !s.serviceable ? a.unserviceable : undefined)} {...register("postalCode")} />
      </div>
      <Input label={a.line1} autoComplete="address-line1" className="sm:col-span-2" error={errors.line1?.message} {...register("line1")} />
      <Input label={a.line2} autoComplete="address-line2" {...register("line2")} />
      <Input label={a.landmark} {...register("landmark")} />
      <Input label={a.city} autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor={sid} className="text-meta font-medium text-ink">{a.state}</label>
        <select
          id={sid} autoComplete="address-level1" aria-invalid={!!errors.state} aria-describedby={errors.state ? `${sid}-msg` : undefined}
          className={clsx("h-11 rounded-sm border bg-surface px-3 text-body text-ink focus:border-ink focus:outline-none", errors.state ? "border-danger" : "border-line")}
          {...register("state")}
        >
          <option value="">{a.selectState}</option>
          {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
        </select>
        {errors.state && <p id={`${sid}-msg`} className="text-meta text-danger">⚠ {errors.state.message}</p>}
      </div>
      {showDefaultToggle && (
        <label className="flex min-h-11 items-center gap-3 text-body sm:col-span-2">
          <input type="checkbox" className="size-5 accent-ink" {...register("isDefault")} /> {a.makeDefault}
        </label>
      )}
      {children && <div className="sm:col-span-2">{children}</div>}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Button type="submit" size="lg" loading={isSubmitting} className="max-sm:w-full">{submitLabel}</Button>
        {onCancel && <Button type="button" variant="ghost" size="lg" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
