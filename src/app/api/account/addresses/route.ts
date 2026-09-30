import { requireUser } from "@/backend/_core/auth";
import { ok, parse, route } from "@/backend/_core/http";
import { createAddress, listAddresses } from "@/backend/account/repo";
import { AddressSchema } from "@/backend/account/schema";

export const GET = route("account.addresses", async () => ok(await listAddresses(await requireUser())));

export const POST = route("account.addresses", async ({ req }) => {
  const session = await requireUser();
  return ok(await createAddress(session, await parse(req, AddressSchema)), { status: 201 });
});
