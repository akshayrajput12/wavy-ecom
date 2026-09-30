"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { evidenceRules, returnReasons } from "@/data/account";
import type { OrderItem } from "@/types/domain";

const schema = z.object({
  itemId: z.string("Select the item to return"),
  reason: z.enum(returnReasons, "Select a reason"),
  notes: z.string().max(500, "Keep notes under 500 characters").optional(),
  evidence: z.custom<FileList | undefined>().superRefine((files, ctx) => {
    const list = Array.from(files ?? []);
    if (list.length > evidenceRules.maxFiles) ctx.addIssue({ code: "custom", message: `Attach up to ${evidenceRules.maxFiles} photos` });
    if (list.some((f) => !evidenceRules.types.includes(f.type))) ctx.addIssue({ code: "custom", message: "Photos must be JPG, PNG or WebP" });
    if (list.some((f) => f.size > evidenceRules.maxBytes)) ctx.addIssue({ code: "custom", message: "Each photo must be under 5 MB" });
  }),
});
type Values = z.infer<typeof schema>;

export function ReturnForm({ orderNumber, items, preselect }: { orderNumber: string; items: OrderItem[]; preselect?: string }) {
  const router = useRouter();
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema), mode: "onTouched",
    defaultValues: { itemId: preselect ?? (items.length === 1 ? items[0].id : undefined), notes: "" },
  });
  const files = Array.from(useWatch({ control, name: "evidence" }) ?? []);
  const reason = useWatch({ control, name: "reason" });
  const needsPhotos = reason === "Damaged or defective" || reason === "Received wrong item";

  const onSubmit = async (v: Values) => {
    const body = new FormData();
    body.set("orderNumber", orderNumber);
    body.set("itemId", v.itemId);
    body.set("reason", v.reason);
    body.set("notes", v.notes ?? "");
    Array.from(v.evidence ?? []).forEach((f) => body.append("evidence", f));
    let ref: string | undefined;
    try {
      const res = await fetch("/api/returns", { method: "POST", body });
      if (res.ok) ref = ((await res.json()) as { data?: { ref?: string } }).data?.ref;
      else if (res.status !== 404 && res.status !== 501) return void toast.error("We couldn't submit your request. Please try again.");
    } catch { /* offline or API not built yet: fall through to demo */ }
    // ponytail: demo fallback until backend builds POST /api/returns
    ref ??= `RT-${orderNumber.slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
    router.push(`/account/returns/success/${ref}?order=${orderNumber}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6">
      <fieldset className="grid gap-2" aria-describedby={errors.itemId ? "item-msg" : undefined}>
        <legend className="mb-2 text-body font-medium">Which item?</legend>
        {items.map((i) => (
          <label key={i.id} className="flex cursor-pointer items-center gap-3 rounded-sm border border-line bg-surface p-3 has-[:checked]:border-ink">
            <input type="radio" value={i.id} className="accent-ink" {...register("itemId")} />
            <span className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-surface-warm">
              <Image src={i.image.url} alt={i.image.alt} fill sizes="56px" className="object-cover" />
            </span>
            <span className="text-body"><span className="font-medium">{i.name}</span><span className="block t-meta">{i.color} · {i.size} · Qty {i.quantity}</span></span>
          </label>
        ))}
        {errors.itemId && <p id="item-msg" className="text-meta text-danger">⚠ {errors.itemId.message}</p>}
      </fieldset>

      <div className="grid gap-1.5">
        <label htmlFor="reason" className="text-meta font-medium">Reason</label>
        <select id="reason" defaultValue="" aria-invalid={!!errors.reason} aria-describedby={errors.reason ? "reason-msg" : undefined}
          className={`h-11 rounded-sm border bg-surface px-3 text-body focus:border-ink focus:outline-none ${errors.reason ? "border-danger" : "border-line"}`}
          {...register("reason")}>
          <option value="" disabled>Select a reason</option>
          {returnReasons.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {errors.reason && <p id="reason-msg" className="text-meta text-danger">⚠ {errors.reason.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="notes" className="text-meta font-medium">Notes (optional)</label>
        <textarea id="notes" rows={4} placeholder="Tell us what went wrong — it helps us fix it."
          className="rounded-sm border border-line bg-surface p-3 text-body focus:border-ink focus:outline-none" {...register("notes")} />
        {errors.notes && <p className="text-meta text-danger">⚠ {errors.notes.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="evidence" className="text-meta font-medium">Photos {needsPhotos ? "(recommended)" : "(optional)"}</label>
        <input id="evidence" type="file" multiple accept={evidenceRules.types.join(",")} aria-describedby="evidence-msg"
          className="text-body file:mr-3 file:min-h-11 file:rounded-pill file:border file:border-ink file:bg-surface file:px-4 file:text-body"
          {...register("evidence")} />
        <p id="evidence-msg" className={`text-meta ${errors.evidence ? "text-danger" : "text-ink-soft"}`}>
          {errors.evidence ? `⚠ ${errors.evidence.message}` : `Up to ${evidenceRules.maxFiles} JPG, PNG or WebP photos, 5 MB each.`}
        </p>
        {files.length > 0 && <ul className="t-meta">{files.map((f) => <li key={f.name}>{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</li>)}</ul>}
      </div>

      <Button type="submit" loading={isSubmitting} className="justify-self-start">Submit return request</Button>
    </form>
  );
}
