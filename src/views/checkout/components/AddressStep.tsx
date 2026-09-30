"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/types/domain";
import type { AddressValues } from "../schema";
import { AddressForm } from "./AddressForm";

export function AddressStep({ saved, value, onDone }: {
  saved: Address[]; value?: AddressValues; onDone: (a: AddressValues) => void;
}) {
  const [picked, setPicked] = useState<string>(saved.find((a) => a.isDefault)?.id ?? saved[0]?.id ?? "new");
  const chosen = saved.find((a) => a.id === picked);

  return (
    <div className="grid gap-5">
      {saved.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-meta font-medium">Saved addresses</legend>
          {[...saved, null].map((a) => {
            const id = a?.id ?? "new";
            return (
              <label key={id} className="flex cursor-pointer gap-3 rounded-sm border border-line bg-surface p-4 has-[:checked]:border-ink">
                <input type="radio" name="saved-address" value={id} checked={picked === id} onChange={() => setPicked(id)} className="mt-1 accent-ink" />
                {a ? (
                  <span className="text-body">
                    <span className="font-medium">{a.name}</span> · {a.phone}
                    <span className="block text-ink-soft">{[a.line1, a.line2, a.city, a.state, a.postalCode].filter(Boolean).join(", ")}</span>
                  </span>
                ) : <span className="text-body font-medium">Use a new address</span>}
              </label>
            );
          })}
        </fieldset>
      )}
      {chosen ? (
        <Button className="justify-self-start" onClick={() => onDone({ ...chosen, state: chosen.state as AddressValues["state"] })}>
          Deliver here
        </Button>
      ) : (
        <AddressForm defaultValues={value} onSubmit={onDone} submitLabel="Continue to shipping" />
      )}
    </div>
  );
}
