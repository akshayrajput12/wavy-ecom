import "server-only";
import { hasSupabase } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { demoUser, orders, returns, type AccountOrder, type ReturnRequest } from "@/data/orders";
import type { Address } from "@/types/domain";

export interface AccountUser { id: string; name: string; email: string; phone: string }

/** Signed-in customer, or null. Without Supabase the demo customer is always "signed in". */
export async function getAccountUser(): Promise<AccountUser | null> {
  if (!hasSupabase) return demoUser;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const meta = data.user.user_metadata as { name?: string; phone?: string };
  return { id: data.user.id, name: meta.name ?? "", email: data.user.email ?? "", phone: meta.phone ?? "" };
}

export async function getOrdersForUser(userId: string): Promise<AccountOrder[]> {
  if (hasSupabase) { /* TODO(backend agent): select orders where user_id = userId, newest first */ }
  void userId;
  return [...orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
}

export async function getOrderByNumber(number: string): Promise<AccountOrder | undefined> {
  if (hasSupabase) { /* TODO(backend agent): RLS-scoped lookup by order number */ }
  return orders.find((o) => o.number === number);
}

/** Public tracking: the token is the only credential, so never expose contact details from here. */
export async function getOrderByTrackingToken(token: string): Promise<AccountOrder | undefined> {
  if (hasSupabase) { /* TODO(backend agent): service-role lookup by tracking_token */ }
  return orders.find((o) => o.trackingToken === token);
}

export async function getAddresses(userId: string): Promise<Address[]> {
  if (hasSupabase) { /* TODO(backend agent): select addresses where user_id = userId */ }
  void userId;
  return demoUser.addresses;
}

export async function getReturnsForUser(userId: string): Promise<ReturnRequest[]> {
  if (hasSupabase) { /* TODO(backend agent): move to backend/returns/repo.ts */ }
  void userId;
  return returns;
}
