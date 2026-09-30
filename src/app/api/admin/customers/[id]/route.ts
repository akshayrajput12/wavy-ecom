import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound } from "@/backend/admin/_shared";
import { getCustomer, setCustomerStatus } from "@/backend/admin/customers";
import { CustomerPatchSchema } from "@/backend/admin/schemas/settings";

type P = { id: string };

export const GET = route<P>("admin.customers", async ({ params }) => ok((await getCustomer(params.id)) ?? notFound("Customer")));

/** {status: active|blocked}. */
export const PATCH = route<P>("admin.customers", async ({ req, params }) => {
  const actor = await guard("customers.write");
  const { status } = await parse(req, CustomerPatchSchema);
  return ok(await setCustomerStatus(actor, params.id, status));
});
