"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/admin/Dialog";
import { Select } from "@/components/admin/Fields";
import type { Coupon } from "@/data/admin/types";
import { COUPON_STATUS } from "@/types/domain";

const schema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,20}$/, "4–20 letters or numbers"),
  type: z.enum(["percent", "flat", "free_shipping"]),
  value: z.number({ error: "Enter a value" }).min(0),
  minOrder: z.number({ error: "Enter 0 for no minimum" }).min(0),
  usageLimit: z.number().int().min(1).optional(),
  startsAt: z.string().min(1, "Required"),
  endsAt: z.string().min(1, "Required"),
  restriction: z.string(),
  status: z.enum(COUPON_STATUS),
}).refine((v) => v.type !== "percent" || v.value <= 90, { path: ["value"], message: "Max 90%" })
  .refine((v) => v.endsAt >= v.startsAt, { path: ["endsAt"], message: "Ends before it starts" });
type Form = z.infer<typeof schema>;

const num = { setValueAs: (v: string) => (v === "" ? undefined : Number(v)) };

export function CouponDialog({ value, onClose, onSave }: { value: Coupon | "new" | null; onClose: () => void; onSave: (c: Coupon) => void }) {
  return (
    <Dialog open={!!value} onClose={onClose} title={value === "new" ? "New coupon" : `Edit ${value?.code ?? ""}`}>
      {value && <CouponForm key={value === "new" ? "new" : value.id} initial={value === "new" ? null : value} onClose={onClose} onSave={onSave} />}
    </Dialog>
  );
}

function CouponForm({ initial, onClose, onSave }: { initial: Coupon | null; onClose: () => void; onSave: (c: Coupon) => void }) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? { ...initial, value: initial.type === "flat" ? initial.value / 100 : initial.value, minOrder: initial.minOrder / 100 }
      : { code: "", type: "percent", value: 10, minOrder: 0, startsAt: "", endsAt: "", restriction: "", status: "draft" },
  });
  const type = useWatch({ control, name: "type" });
  const submit = (v: Form) => onSave({
    id: initial?.id ?? crypto.randomUUID(), usage: initial?.usage ?? 0, ...v,
    value: v.type === "flat" ? Math.round(v.value * 100) : v.value, minOrder: Math.round(v.minOrder * 100),
  });
  return (
    <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(submit)} noValidate>
      <Input label="Code" className="sm:col-span-2" error={errors.code?.message} {...register("code")} />
      <Select label="Type" {...register("type")}>
        <option value="percent">Percent off</option><option value="flat">Flat ₹ off</option><option value="free_shipping">Free shipping</option>
      </Select>
      {type !== "free_shipping" && <Input label={type === "percent" ? "Percent" : "Amount (₹)"} type="number" min={0} error={errors.value?.message} {...register("value", num)} />}
      <Input label="Minimum order (₹)" type="number" min={0} error={errors.minOrder?.message} {...register("minOrder", num)} />
      <Input label="Usage limit (blank = unlimited)" type="number" min={1} error={errors.usageLimit?.message} {...register("usageLimit", num)} />
      <Input label="Starts" type="date" error={errors.startsAt?.message} {...register("startsAt")} />
      <Input label="Ends" type="date" error={errors.endsAt?.message} {...register("endsAt")} />
      <Input label="Restrictions" className="sm:col-span-2" hint="e.g. First order only, Sneakers collection" {...register("restriction")} />
      <Select label="Status" {...register("status")}>{COUPON_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</Select>
      <div className="flex items-end justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="submit" size="sm">Save coupon</Button>
      </div>
    </form>
  );
}
