"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import type { AddressFields } from "@/backend/geo/normalise";
import { Button } from "@/components/ui/Button";
import { Combobox } from "@/components/ui/Combobox";
import { Input } from "@/components/ui/Input";
import { addressCopy, INDIAN_STATES } from "@/data/copy";
import { co } from "../copy";
import { addressSchema, type AddressValues } from "../schema";
import { LocationPicker } from "./LocationPicker";
import { useCities } from "./useCities";
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
const g = addressCopy;
const set = { shouldValidate: true, shouldDirty: true } as const;

/**
 * Indian address form (checkout + account addresses). Pincode -> state + district + locality suggestions, State ->
 * searchable district list (free text allowed), inline live-location map panel under the PIN. Every field stays editable;
 * zod validates on submit and the server re-validates (backend/account/schema.ts canonicalises the state).
 */
export function AddressForm({ defaultValues, onSubmit, submitLabel, onCancel, showDefaultToggle, onChange, children }: Props) {
  const { register, handleSubmit, watch, setValue, getValues, control, formState: { errors, isSubmitting } } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema), mode: "onTouched", defaultValues,
  });
  const pin = watch("postalCode")?.trim();
  const { info, loading } = usePincode(pin);
  const { cities, loading: citiesLoading } = useCities(watch("state"));
  // The PIN whose lookup was last written into state/city: manual edits survive until the PIN itself changes.
  const applied = useRef(defaultValues?.city && defaultValues.state ? defaultValues.postalCode : undefined);

  useEffect(() => { if (!onChange) return; const s = watch((v) => onChange(v)); return () => s.unsubscribe(); }, [watch, onChange]);
  useEffect(() => {
    const geo = info?.geo;
    if (!info || typeof geo !== "object" || applied.current === info.pin) return;
    applied.current = info.pin;
    if (geo.state) setValue("state", geo.state, set);
    if (geo.district) setValue("city", geo.district, set);
  }, [info, setValue]);

  function fillFromMap(f: AddressFields) {
    // OSM postcodes in India are patchy: a PIN the shopper already typed wins over the map's guess.
    if (f.postalCode && !/^[1-9]\d{5}$/.test(getValues("postalCode")?.trim() ?? "")) { applied.current = f.postalCode; setValue("postalCode", f.postalCode, set); }
    if (f.line1 && !getValues("line1")?.trim()) setValue("line1", f.line1, set); // keep a typed house/flat number
    if (f.line2) setValue("line2", f.line2, set);
    if (f.landmark) setValue("landmark", f.landmark, set);
    if (f.state) setValue("state", f.state, set);
    if (f.city) setValue("city", f.city, set);
  }

  const geo = info?.geo;
  const localities = typeof geo === "object" ? geo.localities : [];
  const pinStatus = loading && pin ? g.pin.looking(pin)
    : geo === "not_found" ? g.pin.notFound : geo === "failed" ? g.pin.failed
    : geo && (geo.district || geo.state) ? g.pin.found([geo.district, geo.state].filter(Boolean).join(", ")) : undefined;
  const s = info?.service;
  const svc = s?.serviceable ? [s.estimatedDays && a.eta(co.delivery.days(s.estimatedDays.min, s.estimatedDays.max)), s.codAvailable ? a.cod : a.noCod].filter(Boolean).join(" · ") : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <Input label={a.name} autoComplete="name" error={errors.name?.message} {...register("name")} />
      <Input label={a.phone} type="tel" inputMode="tel" autoComplete="tel-national" maxLength={13} error={errors.phone?.message} {...register("phone")} />
      <div className="sm:col-span-2">
        <Input label={a.pincode} inputMode="numeric" autoComplete="postal-code" maxLength={6} className="sm:max-w-[50%]"
          hint={[pinStatus, svc].filter(Boolean).join(" · ") || a.pincodeHint}
          error={errors.postalCode?.message ?? (s && !s.serviceable ? a.unserviceable : undefined)} {...register("postalCode")} />
        <p role="status" className="sr-only">{pinStatus}</p>
      </div>
      <div className="sm:col-span-2"><LocationPicker onConfirm={fillFromMap} /></div>
      <Input label={a.line1} autoComplete="address-line1" className="sm:col-span-2" error={errors.line1?.message} {...register("line1")} />
      <Controller control={control} name="line2" render={({ field }) => (
        <Combobox label={a.line2} freeText options={localities} placeholder={g.localityPlaceholder} autoComplete="address-line2"
          name={field.name} ref={field.ref} value={field.value} onChange={field.onChange} onBlur={field.onBlur} />
      )} />
      <Input label={a.landmark} {...register("landmark")} />
      <Controller control={control} name="state" render={({ field, fieldState }) => (
        <Combobox label={a.state} options={INDIAN_STATES} placeholder={g.statePlaceholder} autoComplete="address-level1"
          name={field.name} ref={field.ref} value={field.value} onBlur={field.onBlur} error={fieldState.error?.message}
          onChange={(v) => { if (v !== field.value) setValue("city", ""); field.onChange(v); }} />
      )} />
      <Controller control={control} name="city" render={({ field, fieldState }) => (
        <Combobox label={a.city} freeText options={cities} loading={citiesLoading && !cities.length} placeholder={g.cityPlaceholder}
          autoComplete="address-level2" name={field.name} ref={field.ref} value={field.value} onChange={field.onChange}
          onBlur={field.onBlur} error={fieldState.error?.message} />
      )} />
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
