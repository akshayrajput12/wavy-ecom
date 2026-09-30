"use client";

import { Trash2 } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/admin/Fields";
import { Panel } from "@/components/admin/Panel";
import type { Offer } from "@/data/admin/types";
import type { Collection } from "@/types/domain";
import { describeOffer } from "./describe";

type Kind = Offer["kind"];

/** Builder for bundle ("any N from X for ₹Y"), BOGO and tiered offers with a live customer-facing preview. */
export function OfferBuilder({ collections, onCancel, onSave }: { collections: Collection[]; onCancel: () => void; onSave: (o: Offer) => void }) {
  const [kind, setKind] = useState<Kind>("bundle");
  const [name, setName] = useState("");
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [quantity, setQuantity] = useState(3);
  const [price, setPrice] = useState(999);
  const [buy, setBuy] = useState(1);
  const [get, setGet] = useState(1);
  const [tiers, setTiers] = useState([{ minSubtotal: 2999, percentOff: 5 }, { minSubtotal: 4999, percentOff: 10 }]);

  const base = { id: "", name: name.trim() || "Untitled offer", status: "draft" as const };
  const offer: Offer = kind === "bundle" ? { ...base, kind, quantity, collectionId, price: price * 100 }
    : kind === "bogo" ? { ...base, kind, buy, get, collectionId }
    : { ...base, kind, tiers: tiers.map((t) => ({ ...t, minSubtotal: t.minSubtotal * 100 })) };
  const tiersAscending = tiers.every((t, i) => i === 0 || (t.minSubtotal > tiers[i - 1].minSubtotal && t.percentOff > tiers[i - 1].percentOff));
  const valid = name.trim().length > 2 && (kind !== "bundle" || (quantity >= 2 && price > 0)) && (kind !== "bogo" || (buy >= 1 && get >= 1)) && (kind !== "tiered" || (tiers.length > 0 && tiersAscending));
  const n = (set: (v: number) => void) => (e: ChangeEvent<HTMLInputElement>) => set(Math.max(0, Number(e.target.value)));

  return (
    <Panel title="Offer builder" description="Offers stack with coupons only if the coupon allows it.">
      <form className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" onSubmit={(e) => { e.preventDefault(); if (valid) onSave({ ...offer, id: crypto.randomUUID() }); }}>
        <Input label="Offer name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Any 3 for ₹999" />
        <Select label="Type" value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
          <option value="bundle">Bundle — any N for ₹Y</option><option value="bogo">Buy X get Y</option><option value="tiered">Tiered spend discount</option>
        </Select>
        {kind !== "tiered" && (
          <Select label="Collection" value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        )}
        {kind === "bundle" && <>
          <Input label="Items in bundle" type="number" min={2} value={quantity} onChange={n(setQuantity)} />
          <Input label="Bundle price (₹)" type="number" min={1} value={price} onChange={n(setPrice)} />
        </>}
        {kind === "bogo" && <>
          <Input label="Buy" type="number" min={1} value={buy} onChange={n(setBuy)} />
          <Input label="Get free" type="number" min={1} value={get} onChange={n(setGet)} />
        </>}
        {kind === "tiered" && (
          <fieldset className="grid gap-3 sm:col-span-2 xl:col-span-4">
            <legend className="mb-2 text-meta font-medium">Tiers (each higher than the last)</legend>
            {tiers.map((t, i) => (
              <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Input label={`Tier ${i + 1}: cart over (₹)`} type="number" min={0} value={t.minSubtotal} onChange={n((v) => setTiers(tiers.map((x, j) => (j === i ? { ...x, minSubtotal: v } : x))))} />
                <Input label="Percent off" type="number" min={1} max={90} value={t.percentOff} onChange={n((v) => setTiers(tiers.map((x, j) => (j === i ? { ...x, percentOff: v } : x))))} />
                <button type="button" aria-label={`Remove tier ${i + 1}`} onClick={() => setTiers(tiers.filter((_, j) => j !== i))} className="mb-1 rounded-sm p-2.5 hover:bg-surface-warm"><Trash2 className="size-4" /></button>
              </div>
            ))}
            {!tiersAscending && <p className="text-meta text-danger">⚠ Each tier needs a higher threshold and a bigger discount.</p>}
            <Button type="button" size="sm" variant="secondary" className="justify-self-start" onClick={() => setTiers([...tiers, { minSubtotal: (tiers.at(-1)?.minSubtotal ?? 0) + 2000, percentOff: (tiers.at(-1)?.percentOff ?? 0) + 5 }])}>Add tier</Button>
          </fieldset>
        )}
        <div className="rounded-sm bg-surface-warm p-3 sm:col-span-2 xl:col-span-4" aria-live="polite">
          <p className="t-overline text-ink-soft">Customer sees</p>
          <p className="mt-1 text-body font-medium">{describeOffer(offer, collections)}</p>
        </div>
        <div className="flex justify-end gap-2 sm:col-span-2 xl:col-span-4">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button type="submit" size="sm" disabled={!valid}>Save as draft</Button>
        </div>
      </form>
    </Panel>
  );
}
