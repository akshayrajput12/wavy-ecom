"use client";

import { clsx } from "clsx";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { returnReasonLabels } from "@/data/copy";
import { formatDate } from "@/lib/format";
import { api } from "@/stores/http";
import { RETURN_REASON, type Order, type OrderItem, type ReturnReason, type ReturnRequest } from "@/types/domain";
import { ac } from "@/views/account/copy";
import { returnDeadline } from "../eligibility";

type Resolution = keyof typeof ac.resolutions;
const field = "h-11 rounded-sm border bg-surface px-3 text-body focus:border-ink focus:outline-none";

/** POST /api/returns. The DB enforces window, ownership and quantity; errors come back as shopper text. */
export function ReturnForm({ order, items, preselect }: { order: Order; items: OrderItem[]; preselect?: string }) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>(() => (preselect ? { [preselect]: 1 } : items.length === 1 ? { [items[0].id]: 1 } : {}));
  const [reason, setReason] = useState<ReturnReason | "">("");
  const [resolution, setResolution] = useState<Resolution>("refund");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ items?: string; reason?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const picked = Object.entries(qty).filter(([, n]) => n > 0);
    const next = { items: picked.length ? undefined : ac.pickItem, reason: reason ? undefined : ac.selectReason };
    setErrors(next);
    if (next.items || next.reason) return;
    setBusy(true);
    const r = await api<ReturnRequest>("/api/returns", {
      body: { orderNumber: order.number, reason, resolution, customerNote: note.trim() || undefined, items: picked.map(([orderItemId, quantity]) => ({ orderItemId, quantity })) },
    });
    if (!r.ok) { setBusy(false); return setErrors({ form: r.error.message }); }
    router.push(`/account/returns/success/${encodeURIComponent(r.data.rmaNumber)}?order=${encodeURIComponent(order.number)}`);
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      <fieldset className="grid gap-2" aria-describedby={errors.items ? "items-msg" : undefined}>
        <legend className="mb-2 text-body font-medium">{ac.whichItems}</legend>
        {items.map((i) => {
          const on = (qty[i.id] ?? 0) > 0;
          const end = returnDeadline(order, i);
          return (
            <div key={i.id} className={clsx("flex flex-wrap items-center gap-3 rounded-md border bg-surface p-3", on ? "border-ink bg-accent-soft" : "border-line")}>
              <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
                <input type="checkbox" className="size-5 accent-ink" checked={on} onChange={(e) => setQty((q) => ({ ...q, [i.id]: e.target.checked ? 1 : 0 }))} />
                <span className="relative size-14 shrink-0 overflow-hidden rounded-sm bg-surface-2">
                  {i.image?.url && <Image src={i.image.url} alt={i.image.alt || i.name} fill sizes="56px" className="object-cover" />}
                </span>
                <span className="text-body">
                  <span className="font-medium">{i.name}</span>
                  <span className="block t-meta">{i.variantTitle !== "Default" ? `${i.variantTitle} · ` : ""}{end && ac.returnWindow(formatDate(end))}</span>
                </span>
              </label>
              {on && i.quantity > 1 && (
                <label className="flex items-center gap-2 text-meta">{ac.qty}
                  <select className={clsx(field, "border-line")} value={qty[i.id]} onChange={(e) => setQty((q) => ({ ...q, [i.id]: Number(e.target.value) }))}>
                    {Array.from({ length: Math.min(i.quantity, 10) }, (_, n) => <option key={n} value={n + 1}>{n + 1}</option>)}
                  </select>
                </label>
              )}
            </div>
          );
        })}
        {errors.items && <p id="items-msg" className="text-meta text-danger">⚠ {errors.items}</p>}
      </fieldset>

      <div className="grid gap-1.5">
        <label htmlFor="reason" className="text-meta font-medium">{ac.reason}</label>
        <select id="reason" value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)} aria-invalid={!!errors.reason}
          aria-describedby={errors.reason ? "reason-msg" : undefined} className={clsx(field, errors.reason ? "border-danger" : "border-line")}>
          <option value="">{ac.selectReason}</option>
          {RETURN_REASON.map((r) => <option key={r} value={r}>{returnReasonLabels[r]}</option>)}
        </select>
        {errors.reason && <p id="reason-msg" className="text-meta text-danger">⚠ {errors.reason}</p>}
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-meta font-medium">{ac.resolution}</legend>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ac.resolutions) as Resolution[]).map((k) => (
            <label key={k} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-line bg-surface px-4 has-[:checked]:border-ink has-[:checked]:bg-accent-soft">
              <input type="radio" name="resolution" value={k} checked={resolution === k} onChange={() => setResolution(k)} className="size-4 accent-ink" /> {ac.resolutions[k]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-1.5">
        <label htmlFor="note" className="text-meta font-medium">{ac.notes}</label>
        <textarea id="note" rows={4} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)}
          className="rounded-sm border border-line bg-surface p-3 text-body focus:border-ink focus:outline-none" />
      </div>

      {errors.form && <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-body text-danger">⚠ {errors.form}</p>}
      <Button type="submit" size="lg" loading={busy} className="sm:justify-self-start">{ac.submitReturn}</Button>
    </form>
  );
}
