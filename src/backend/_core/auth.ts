import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { ApiError } from "./http";
import { can, isStaffRole, type Permission } from "./permissions";
import type { UserRole } from "@/types/domain";

export interface Session {
  userId: string;
  email?: string;
  role: UserRole;
}

/**
 * Current session from the verified JWT (`user_role` claim is added by
 * public.custom_access_token_hook). Cached per request. Postgres RLS re-checks
 * every permission, so this is the fast first gate, not the only one.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const c = data?.claims;
  if (!c?.sub) return null;
  return { userId: c.sub, email: c.email as string | undefined, role: ((c.user_role as UserRole) ?? "customer") };
});

export async function requireUser(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new ApiError(401, "unauthenticated", "Please sign in");
  return s;
}

export async function requireStaff(): Promise<Session> {
  const s = await requireUser();
  if (!isStaffRole(s.role)) throw new ApiError(403, "forbidden", "Staff access only");
  return s;
}

export async function requirePermission(permission: Permission): Promise<Session> {
  const s = await requireUser();
  if (!can(s.role, permission)) throw new ApiError(403, "forbidden", `Missing permission: ${permission}`);
  return s;
}
