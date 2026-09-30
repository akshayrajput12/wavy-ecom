import { z } from "zod";
import { requireUser } from "@/backend/_core/auth";
import { ok, parse, route } from "@/backend/_core/http";
import { deleteAddress, updateAddress } from "@/backend/account/repo";
import { AddressPatchSchema } from "@/backend/account/schema";

const Id = z.string().uuid();

export const PATCH = route<{ id: string }>("account.addresses", async ({ req, params }) => {
  const session = await requireUser();
  return ok(await updateAddress(session, Id.parse(params.id), await parse(req, AddressPatchSchema)));
});

export const DELETE = route<{ id: string }>("account.addresses", async ({ params }) => {
  await deleteAddress(await requireUser(), Id.parse(params.id));
  return ok({ deleted: true });
});
