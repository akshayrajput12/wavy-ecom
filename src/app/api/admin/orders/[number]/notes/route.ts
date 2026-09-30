import { ok, parse, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { addOrderNote } from "@/backend/admin/orders";
import { NoteSchema } from "@/backend/admin/schemas/ops";

export const POST = route<{ number: string }>("admin.orders", async ({ req, params }) => {
  const actor = await guard("orders.write");
  const { body } = await parse(req, NoteSchema);
  return ok(await addOrderNote(actor, params.number, body), { status: 201 });
});
