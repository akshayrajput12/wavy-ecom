import { requireUser } from "@/backend/_core/auth";
import { ok, parse, route } from "@/backend/_core/http";
import { getAccountUser, updateProfile } from "@/backend/account/repo";
import { ProfileSchema } from "@/backend/account/schema";

export const GET = route("account.profile", async () => {
  await requireUser();
  return ok(await getAccountUser());
});

export const PATCH = route("account.profile", async ({ req }) => {
  const session = await requireUser();
  await updateProfile(session, await parse(req, ProfileSchema));
  return ok(await getAccountUser());
});
