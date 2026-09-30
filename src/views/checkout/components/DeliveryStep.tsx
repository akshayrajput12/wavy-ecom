"use client";

import { clsx } from "clsx";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/types/domain";
import { co } from "../copy";
import { addressSchema, type AddressValues } from "../schema";
import { AddressForm } from "./AddressForm";
import { ShippingOptions } from "./ShippingOptions";

type Props = {
  saved: Address[]; signedIn: boolean; address: Partial<AddressValues>; addressId?: string; saveAddress?: boolean;
  shippingMethodId?: string; net: number; threshold?: number;
  onChange: (patch: { address?: Partial<AddressValues>; addressId?: string; saveAddress?: boolean; shippingMethodId?: string }) => void;
  onDone: (address: AddressValues) => void;
};

const toValues = (a: Address) => addressSchema.safeParse({ ...a, line2: a.line2 ?? undefined, landmark: a.landmark ?? undefined });

/** Saved-address picker (signed in) or the address form, plus delivery speed. One primary button. */
export function DeliveryStep({ saved, signedIn, address, addressId, saveAddress, shippingMethodId, net, threshold, onChange, onDone }: Props) {
  const [picked, setPicked] = useState(addressId ?? saved.find((a) => a.isDefault)?.id ?? saved[0]?.id ?? "new");
  const chosen = saved.find((a) => a.id === picked);
  const chosenValues = chosen ? toValues(chosen) : undefined;
  const onAddress = useCallback((v: Partial<AddressValues>) => onChange({ address: v }), [onChange]);
  const onMethod = useCallback((id: string) => onChange({ shippingMethodId: id }), [onChange]);

  const pick = (id: string) => {
    setPicked(id);
    const a = saved.find((s) => s.id === id);
    onChange({ addressId: id, address: a ? { ...a } as Partial<AddressValues> : {} });
  };
  const options = <ShippingOptions state={chosen ? chosen.state : address.state} value={shippingMethodId} net={net} threshold={threshold} onChange={onMethod} />;

  return (
    <div className="grid gap-5">
      {saved.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-meta font-medium">{co.delivery.saved}</legend>
          {[...saved.map((a) => a.id ?? ""), "new"].map((id) => {
            const a = saved.find((s) => s.id === id);
            return (
              <label key={id} className={clsx("flex min-h-14 cursor-pointer gap-3 rounded-md border border-line bg-surface p-4 transition-colors",
                "has-[:checked]:border-ink has-[:checked]:bg-accent-soft hover:border-ink-muted")}>
                <input type="radio" name="saved-address" value={id} checked={picked === id} onChange={() => pick(id)} className="mt-0.5 size-5 accent-ink" />
                {a ? (
                  <span className="text-body">
                    <span className="font-medium">{a.label ? `${a.label} · ` : ""}{a.name}</span> · {a.phone}
                    <span className="block text-meta text-ink-soft">{[a.line1, a.line2, a.city, a.state, a.postalCode].filter(Boolean).join(", ")}</span>
                  </span>
                ) : <span className="text-body font-medium">{co.delivery.useNew}</span>}
              </label>
            );
          })}
        </fieldset>
      )}
      {chosen && chosenValues?.success ? (
        <div className="grid gap-5">
          {options}
          <Button size="lg" className="sm:justify-self-start" disabled={!shippingMethodId} onClick={() => onDone(chosenValues.data)}>{co.delivery.cta}</Button>
        </div>
      ) : (
        <AddressForm key={picked} defaultValues={chosen ? { ...chosen } as Partial<AddressValues> : address} onChange={onAddress} onSubmit={onDone} submitLabel={co.delivery.cta}>
          <div className="grid gap-4">
            {options}
            {signedIn && (
              <label className="flex min-h-11 items-center gap-3 text-body">
                <input type="checkbox" className="size-5 accent-ink" checked={!!saveAddress} onChange={(e) => onChange({ saveAddress: e.target.checked })} /> {co.delivery.save}
              </label>
            )}
          </div>
        </AddressForm>
      )}
    </div>
  );
}
