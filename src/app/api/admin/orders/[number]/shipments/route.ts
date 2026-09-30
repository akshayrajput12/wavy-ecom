import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { createShipment, updateShipment } from "@/backend/admin/fulfilment";
import { ShipmentCreateSchema, ShipmentUpdateSchema } from "@/backend/admin/schemas/ops";

type P = { number: string };

export const POST = route<P>("admin.shipments", async ({ req, params }) => {
  const actor = await guard("shipments.write");
  return ok(await createShipment(actor, params.number, await parse(req, ShipmentCreateSchema)), { status: 201 });
});

/** {id, ...fields, status?, note?, location?}; a status change logs a shipment event and moves the order forward. */
export const PATCH = route<P>("admin.shipments", async ({ req, params }) => {
  const actor = await guard("shipments.write");
  return ok(await updateShipment(actor, params.number, await parse(req, ShipmentUpdateSchema)));
});
