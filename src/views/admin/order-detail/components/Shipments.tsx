"use client";

import { useState } from "react";
import { Panel } from "@/components/admin/Panel";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ShipmentCreateSchema, ShipmentUpdateSchema } from "@/backend/admin/schemas/ops";
import { SHIPMENT_STATUS } from "@/types/domain";
import type { AdminShipment } from "@/types/admin";
import { useAct } from "../../orders/components/act";
import { detailErrors, fieldErrors, fmtDateTime } from "../../orders/components/fmt";

function ShipmentForm({ orderNumber, shipment }: { orderNumber: string; shipment?: AdminShipment }) {
  const { busy, run } = useAct();
  const [f, setF] = useState({ awb: shipment?.awb ?? "", courierName: shipment?.courierName ?? "", trackingUrl: shipment?.trackingUrl ?? "", status: shipment?.status ?? "created", note: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const blank = (s: string) => s.trim() || null;

  const save = async () => {
    const fields = { awb: blank(f.awb), courierName: blank(f.courierName), trackingUrl: blank(f.trackingUrl) };
    const parsed = shipment
      ? ShipmentUpdateSchema.safeParse({ id: shipment.id, ...fields, status: f.status, note: blank(f.note) })
      : ShipmentCreateSchema.safeParse({ provider: "manual", ...fields });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    const res = await run(shipment ? "PATCH" : "POST", `orders/${orderNumber}/shipments`, parsed.data, shipment ? "Shipment updated" : "Shipment created");
    if (!res.ok) setErrors(detailErrors(res.details));
    else if (!shipment) setF({ ...f, awb: "", courierName: "", trackingUrl: "" });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input label="AWB" value={f.awb} onChange={set("awb")} error={errors.awb} />
      <Input label="Carrier" value={f.courierName} onChange={set("courierName")} error={errors.courierName} />
      <Input label="Tracking URL" value={f.trackingUrl} onChange={set("trackingUrl")} error={errors.trackingUrl} className="sm:col-span-2" />
      {shipment && (
        <>
          <label className="flex flex-col gap-1.5 text-meta font-medium">Status
            <select value={f.status} onChange={set("status")} className="h-11 rounded-sm border border-line bg-surface px-3 text-body">
              {SHIPMENT_STATUS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </label>
          <Input label="Event note" value={f.note} onChange={set("note")} />
        </>
      )}
      <div className="sm:col-span-2"><Button type="button" size="sm" loading={busy} onClick={() => void save()}>{shipment ? "Save shipment" : "Add shipment"}</Button></div>
    </div>
  );
}

export function Shipments({ orderNumber, shipments }: { orderNumber: string; shipments: AdminShipment[] }) {
  return (
    <Panel title="Shipments">
      <div className="flex flex-col gap-5">
        {shipments.map((s) => (
          <div key={s.id} className="flex flex-col gap-3 border-b border-line pb-5">
            <p className="flex flex-wrap items-center gap-2"><StatusBadge status={s.status} /><span className="t-meta">{s.direction} · {s.provider}{s.eta ? ` · ETA ${s.eta}` : ""}</span></p>
            {s.events.length > 0 && (
              <ol className="t-meta flex flex-col gap-0.5">
                {s.events.slice(-4).map((e) => <li key={e.id}>{fmtDateTime(e.occurredAt)} · {e.status}{e.location ? ` · ${e.location}` : ""}</li>)}
              </ol>
            )}
            <ShipmentForm orderNumber={orderNumber} shipment={s} />
          </div>
        ))}
        <div><h3 className="mb-2 text-body font-medium">{shipments.length ? "Add another shipment" : "Create shipment"}</h3><ShipmentForm orderNumber={orderNumber} /></div>
      </div>
    </Panel>
  );
}
