"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select, Toggle } from "@/components/admin/Fields";
import { FormSection } from "@/components/admin/Panel";
import { Input } from "@/components/ui/Input";
import { CouponPatchSchema, CouponSchema } from "@/backend/admin/schemas/marketing";
import type { AdminCoupon, DiscountTarget } from "@/types/admin";
import { COUPON_STATUS } from "@/types/domain";
import { mutate } from "../../api";
import { RemoveButton } from "../../_kit/Remove";
import { detailErrors, fieldErrors, fromLocalInput, toLocalInput, toPaise, toRupees } from "../../orders/components/fmt";
import { FormActions } from "../../orders/components/FormActions";
import { TargetPicker, type TargetOptions } from "./TargetPicker";

const num = (s: string) => (s.trim() ? Number(s) : null);

export function CouponForm({ coupon, options }: { coupon?: AdminCoupon; options: TargetOptions }) {
  const router = useRouter();
  const [f, setF] = useState({
    code: coupon?.code ?? "", description: coupon?.description ?? "", type: coupon?.type ?? "percent",
    value: coupon ? (coupon.type === "fixed" ? toRupees(coupon.value) : String(coupon.value)) : "",
    minOrder: toRupees(coupon?.minOrderAmount ?? 0), maxDiscount: toRupees(coupon?.maxDiscountAmount),
    limitTotal: String(coupon?.usageLimitTotal ?? ""), limitUser: String(coupon?.usageLimitPerUser ?? ""),
    firstOrderOnly: coupon?.firstOrderOnly ?? false, combinable: coupon?.combinableWithOffers ?? true,
    startsAt: toLocalInput(coupon?.startsAt), endsAt: toLocalInput(coupon?.endsAt), status: coupon?.status ?? "draft",
  });
  const [targets, setTargets] = useState<DiscountTarget[]>(coupon?.targets ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const text = (k: keyof typeof f) => ({ value: String(f[k]), onChange: (e: { target: { value: string } }) => set(k, e.target.value as never), error: errors[k] });

  const payload = () => ({
    code: f.code, description: f.description.trim() || null, type: f.type,
    value: f.type === "percent" ? Number(f.value) : f.type === "fixed" ? toPaise(f.value) : 0,
    minOrderAmount: f.minOrder ? toPaise(f.minOrder) : 0, maxDiscountAmount: f.maxDiscount ? toPaise(f.maxDiscount) : null,
    usageLimitTotal: num(f.limitTotal), usageLimitPerUser: num(f.limitUser), firstOrderOnly: f.firstOrderOnly, combinableWithOffers: f.combinable,
    startsAt: fromLocalInput(f.startsAt), endsAt: fromLocalInput(f.endsAt), status: f.status,
    targets: targets.map(({ mode, kind, id }) => ({ mode, kind, id })),
  });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = (coupon ? CouponPatchSchema : CouponSchema).safeParse(payload());
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSaving(true);
    const res = await mutate(coupon ? "PATCH" : "POST", coupon ? `coupons/${coupon.id}` : "coupons", parsed.data, { success: coupon ? "Coupon saved" : "Coupon created" });
    setSaving(false);
    if (res.ok) { router.push("/admin/coupons"); router.refresh(); } else setErrors(detailErrors(res.details));
  };

  return (
    <form onSubmit={save} noValidate>
      <FormSection title="Code and status">
        <Input label="Code" {...text("code")} maxLength={32} hint="3-32 letters, numbers, _ or -" />
        <Select label="Status" value={f.status} onChange={(e) => set("status", e.target.value as typeof f.status)} error={errors.status}>{COUPON_STATUS.map((s) => <option key={s}>{s}</option>)}</Select>
        <Input label="Description" {...text("description")} className="sm:col-span-2" maxLength={300} />
      </FormSection>
      <FormSection title="Discount">
        <Select label="Type" value={f.type} onChange={(e) => set("type", e.target.value as typeof f.type)}><option value="percent">Percent off</option><option value="fixed">Fixed amount off</option><option value="free_shipping">Free shipping</option></Select>
        {f.type !== "free_shipping" && <Input label={f.type === "percent" ? "Percent (1-100)" : "Amount (INR)"} type="number" min="0" step={f.type === "percent" ? "1" : "0.01"} {...text("value")} />}
        <Input label="Minimum order (INR)" type="number" min="0" step="0.01" {...text("minOrder")} />
        {f.type === "percent" && <Input label="Maximum discount (INR)" type="number" min="0" step="0.01" {...text("maxDiscount")} hint="Blank = no cap" />}
      </FormSection>
      <FormSection title="Limits and validity">
        <Input label="Total redemptions" type="number" min="1" {...text("limitTotal")} hint="Blank = unlimited" />
        <Input label="Per customer" type="number" min="1" {...text("limitUser")} hint="Blank = unlimited" />
        <Input label="Starts" type="datetime-local" {...text("startsAt")} />
        <Input label="Ends" type="datetime-local" {...text("endsAt")} />
        <div className="grid gap-3 sm:col-span-2">
          <Toggle label="First order only" checked={f.firstOrderOnly} onChange={(v) => set("firstOrderOnly", v)} />
          <Toggle label="Can combine with offers" checked={f.combinable} onChange={(v) => set("combinable", v)} />
        </div>
      </FormSection>
      <FormSection title="Targeting" description="Limit the coupon to specific products, variants, categories or collections.">
        <div className="sm:col-span-2">
          <TargetPicker value={targets} onChange={setTargets} options={options} />
          {errors.targets && <p className="mt-2 text-meta text-danger">⚠ {errors.targets}</p>}
        </div>
      </FormSection>
      <FormActions saving={saving} backHref="/admin/coupons" extra={coupon && <RemoveButton noun="coupons" ids={[coupon.id]} name={coupon.code} back="/admin/coupons" />} />
    </form>
  );
}
