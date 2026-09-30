"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select } from "@/components/admin/Fields";
import { FormSection } from "@/components/admin/Panel";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OfferPatchSchema, OfferSchema } from "@/backend/admin/schemas/marketing";
import { slugify } from "@/lib/format";
import type { AdminOffer, DiscountTarget } from "@/types/admin";
import { COUPON_STATUS } from "@/types/domain";
import { mutate } from "../../api";
import { TargetPicker, type TargetOptions } from "../../coupons/components/TargetPicker";
import { ConfirmDelete } from "../../orders/components/ConfirmDelete";
import { detailErrors, fieldErrors, fromLocalInput, toLocalInput, toPaise, toRupees } from "../../orders/components/fmt";
import { FormActions } from "../../orders/components/FormActions";

const num = (s: string) => (s.trim() ? Number(s) : null);
type OfferType = AdminOffer["type"];

export function OfferForm({ offer, options }: { offer?: AdminOffer; options: TargetOptions }) {
  const router = useRouter();
  const [f, setF] = useState({
    name: offer?.name ?? "", slug: offer?.slug ?? "", description: offer?.description ?? "", type: (offer?.type ?? "bundle_fixed_price") as OfferType,
    status: offer?.status ?? "draft", priority: String(offer?.priority ?? 0),
    requiredQty: String(offer?.requiredQty ?? ""), bundlePrice: toRupees(offer?.bundlePrice),
    buyQty: String(offer?.buyQty ?? ""), getQty: String(offer?.getQty ?? ""), getPct: String(offer?.getDiscountPercent ?? ""),
    maxApps: String(offer?.maxApplicationsPerOrder ?? ""), limitTotal: String(offer?.usageLimitTotal ?? ""),
    startsAt: toLocalInput(offer?.startsAt), endsAt: toLocalInput(offer?.endsAt), badge: offer?.badgeText ?? "", nudge: offer?.nudgeTemplate ?? "",
  });
  const [tiers, setTiers] = useState((offer?.tiers ?? [{ minQty: 2, percent: 10 }]).map((t) => ({ minQty: String(t.minQty), percent: String(t.percent) })));
  const [targets, setTargets] = useState<DiscountTarget[]>(offer?.targets ?? []);
  const [slugTouched, setSlugTouched] = useState(!!offer);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v, ...(k === "name" && !slugTouched ? { slug: slugify(String(v)) } : {}) }));
  const text = (k: keyof typeof f, err = k as string) => ({ value: String(f[k]), onChange: (e: { target: { value: string } }) => set(k, e.target.value as never), error: errors[err] });

  const payload = () => ({
    name: f.name.trim(), slug: f.slug, description: f.description.trim() || null, type: f.type, status: f.status, priority: Number(f.priority) || 0,
    requiredQty: f.type === "bundle_fixed_price" ? num(f.requiredQty) : null, bundlePrice: f.type === "bundle_fixed_price" && f.bundlePrice ? toPaise(f.bundlePrice) : null,
    buyQty: f.type === "bogo" ? num(f.buyQty) : null, getQty: f.type === "bogo" ? num(f.getQty) : null, getDiscountPercent: f.type === "bogo" ? num(f.getPct) : null,
    tiers: f.type === "tiered_percent" ? tiers.map((t) => ({ minQty: Number(t.minQty), percent: Number(t.percent) })) : null,
    maxApplicationsPerOrder: num(f.maxApps), usageLimitTotal: num(f.limitTotal), startsAt: fromLocalInput(f.startsAt), endsAt: fromLocalInput(f.endsAt),
    badgeText: f.badge.trim() || null, nudgeTemplate: f.nudge.trim() || null, targets: targets.map(({ mode, kind, id }) => ({ mode, kind, id })),
  });
  const done = () => { router.push("/admin/offers"); router.refresh(); };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = (offer ? OfferPatchSchema : OfferSchema).safeParse(payload());
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSaving(true);
    const res = await mutate(offer ? "PATCH" : "POST", offer ? `offers/${offer.id}` : "offers", parsed.data, { success: offer ? "Offer saved" : "Offer created" });
    setSaving(false);
    if (res.ok) done(); else setErrors(detailErrors(res.details));
  };
  const remove = async () => {
    setSaving(true);
    const res = await mutate("DELETE", `offers/${offer?.id}`, undefined, { success: "Offer deleted" });
    setSaving(false);
    if (res.ok) done();
  };
  const setTier = (i: number, k: "minQty" | "percent", v: string) => setTiers(tiers.map((t, j) => (j === i ? { ...t, [k]: v } : t)));

  return (
    <form onSubmit={save} noValidate>
      <FormSection title="Basics">
        <Input label="Name" {...text("name")} maxLength={120} />
        <Input label="Slug" value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} error={errors.slug} />
        <Input label="Description" {...text("description")} className="sm:col-span-2" maxLength={500} />
        <Select label="Status" value={f.status} onChange={(e) => set("status", e.target.value as typeof f.status)}>{COUPON_STATUS.map((s) => <option key={s}>{s}</option>)}</Select>
        <Input label="Priority" type="number" {...text("priority")} hint="Higher wins when offers overlap" />
      </FormSection>
      <FormSection title="Rule">
        <Select label="Type" value={f.type} onChange={(e) => set("type", e.target.value as OfferType)}>
          <option value="bundle_fixed_price">Bundle at a fixed price</option><option value="bogo">Buy X get Y</option><option value="tiered_percent">Tiered percent off</option>
        </Select>
        {f.type === "bundle_fixed_price" && <><Input label="Items in bundle" type="number" min="2" {...text("requiredQty")} /><Input label="Bundle price (INR)" type="number" min="0" step="0.01" {...text("bundlePrice")} /></>}
        {f.type === "bogo" && <><Input label="Buy quantity" type="number" min="1" {...text("buyQty")} /><Input label="Get quantity" type="number" min="1" {...text("getQty")} /><Input label="Discount on the free items (%)" type="number" min="1" max="100" {...text("getPct", "getDiscountPercent")} /></>}
        {f.type === "tiered_percent" && (
          <div className="flex flex-col gap-2 sm:col-span-2">
            {tiers.map((t, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <Input label="Min quantity" type="number" min="2" value={t.minQty} onChange={(e) => setTier(i, "minQty", e.target.value)} className="w-36" />
                <Input label="Percent off" type="number" min="1" max="100" value={t.percent} onChange={(e) => setTier(i, "percent", e.target.value)} className="w-36" />
                <Button type="button" size="sm" variant="ghost" disabled={tiers.length === 1} onClick={() => setTiers(tiers.filter((_, j) => j !== i))}>Remove tier</Button>
              </div>
            ))}
            {errors.tiers && <p className="text-meta text-danger">⚠ {errors.tiers}</p>}
            <div><Button type="button" size="sm" variant="secondary" disabled={tiers.length >= 10} onClick={() => setTiers([...tiers, { minQty: "", percent: "" }])}>Add tier</Button></div>
          </div>
        )}
      </FormSection>
      <FormSection title="Limits and display">
        <Input label="Max applications per order" type="number" min="1" {...text("maxApps", "maxApplicationsPerOrder")} hint="Blank = unlimited" />
        <Input label="Total redemptions" type="number" min="1" {...text("limitTotal", "usageLimitTotal")} hint="Blank = unlimited" />
        <Input label="Starts" type="datetime-local" {...text("startsAt")} /><Input label="Ends" type="datetime-local" {...text("endsAt")} />
        <Input label="Badge text" {...text("badge", "badgeText")} maxLength={40} /><Input label="Cart nudge" {...text("nudge", "nudgeTemplate")} maxLength={160} />
      </FormSection>
      <FormSection title="Targeting" description="Limit the offer to specific products, variants, categories or collections.">
        <div className="sm:col-span-2"><TargetPicker value={targets} onChange={setTargets} options={options} />{errors.targets && <p className="mt-2 text-meta text-danger">⚠ {errors.targets}</p>}</div>
      </FormSection>
      <FormActions saving={saving} backHref="/admin/offers" extra={offer && <ConfirmDelete busy={saving} onConfirm={() => void remove()} />} />
    </form>
  );
}
