import "server-only";
import type { z } from "zod";
import { ApiError } from "@/backend/_core/http";
import { can } from "@/backend/_core/permissions";
import type { AdminCustomerDetail, AdminCustomerRow, AdminStaff, Paginated, StaffSession } from "@/types/admin";
import type { Tables } from "@/types/database";
import { type Actor, audit, camel, db, exec, maybe, must, notFound, pageRange, read, searchTerm, staffSession } from "./_shared";
import { toOrderRows } from "./orders";
import type { CustomerListQuery, StaffInviteSchema, StaffPatchSchema } from "./schemas/settings";

const LIVE = new Set(["paid", "processing", "packed", "shipped", "delivered", "return_requested", "returned"]);

async function toCustomerRows(profiles: Tables<"profiles">[]): Promise<AdminCustomerRow[]> {
  const ids = profiles.map((p) => p.id);
  const orders = ids.length ? must(await db().from("orders").select("user_id, total, status, placed_at").in("user_id", ids)) : [];
  return profiles.map((p) => {
    const mine = orders.filter((o) => o.user_id === p.id);
    const live = mine.filter((o) => LIVE.has(o.status));
    return {
      id: p.id, email: p.email, fullName: p.full_name, phone: p.phone, status: p.status, role: p.role, createdAt: p.created_at,
      lastSeenAt: p.last_seen_at, orders: mine.length, lifetimeValue: live.reduce((s, o) => s + o.total, 0),
      lastOrderAt: mine.map((o) => o.placed_at).sort().at(-1) ?? null,
    };
  });
}

export const listCustomers = (q: z.infer<typeof CustomerListQuery>) =>
  read("customers.read", { items: [], total: 0, page: q.page, pageSize: q.pageSize } as Paginated<AdminCustomerRow>, async () => {
    const [from, to] = pageRange(q.page, q.pageSize);
    let b = db().from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (q.status) b = b.eq("status", q.status);
    const term = searchTerm(q.q);
    if (term) b = b.or(["email", "full_name", "phone"].map((k) => `${k}.ilike."%${term}%"`).join(","));
    const res = await b.range(from, to);
    return { items: await toCustomerRows(must(res)), total: res.count ?? 0, page: q.page, pageSize: q.pageSize };
  });

/** Journey is included only when the viewer has journey.read. */
export const getCustomer = (id: string) => read("customers.read", null as AdminCustomerDetail | null, async (actor) => {
  const c = db();
  const p = maybe(await c.from("profiles").select("*").eq("id", id).maybeSingle());
  if (!p) return null;
  const [customer, addresses, orders, tickets, journey] = await Promise.all([
    toCustomerRows([p]).then((r) => r[0]),
    c.from("addresses").select("*").eq("user_id", id).order("created_at").then(must),
    c.from("orders").select("id, order_number, status, payment_status, payment_provider, customer_name, email, phone, total, placed_at")
      .eq("user_id", id).order("placed_at", { ascending: false }).limit(50).then(must),
    c.from("support_tickets").select("*").eq("user_id", id).order("created_at", { ascending: false }).then(must),
    can(actor.role, "journey.read") ? c.rpc("get_customer_journey", { p_user_id: id, p_limit: 200 }).then(must) : null,
  ]);
  return {
    customer, addresses: addresses.map(camel), orders: await toOrderRows(orders), tickets: tickets.map(camel),
    journey: journey?.map((j) => ({ occurredAt: j.occurred_at, kind: j.kind, summary: j.summary, refId: j.ref_id, detail: j.detail })) ?? null,
  };
});

export async function setCustomerStatus(actor: Actor, id: string, status: "active" | "blocked") {
  const c = db();
  const before = maybe(await c.from("profiles").select("id, status, role").eq("id", id).maybeSingle());
  if (!before) notFound("Customer");
  if (before.role !== "customer") throw new ApiError(422, "is_staff", "Suspend staff from the staff screen");
  exec(await c.from("profiles").update({ status }).eq("id", id));
  await audit(actor, "customer.status", "profiles", id, before, { ...before, status });
  return { id, status };
}

// ---------- Staff ----------
export const listStaff = () => read("staff.manage", [] as AdminStaff[], async () => {
  const c = db();
  const rows = must(await c.from("staff_members").select("*").order("created_at"));
  const ids = rows.map((r) => r.user_id).filter((x): x is string => !!x);
  const seen = ids.length ? must(await c.from("profiles").select("id, last_seen_at").in("id", ids)) : [];
  const last = new Map(seen.map((s) => [s.id, s.last_seen_at]));
  return rows.map((r) => ({ ...camel(r), lastSeenAt: r.user_id ? last.get(r.user_id) ?? null : null }));
});

/** Admin shell identity (DB-verified); null when signed out, not staff, or Supabase is not configured. */
export const getCurrentStaff = (): Promise<StaffSession | null> => staffSession();

/**
 * Creates (or re-sends) an invite. Existing accounts are linked by email and activate on next sign-in;
 * new emails get a Supabase invite mail.
 */
export async function inviteStaff(actor: Actor, input: z.infer<typeof StaffInviteSchema>) {
  const c = db();
  let row = maybe(await c.from("staff_members").select("*").eq("email", input.email).maybeSingle());
  if (row && row.status !== "invited") throw new ApiError(409, "already_staff", `${input.email} is already ${row.status} staff`);
  row ??= must(await c.from("staff_members").insert({ email: input.email, full_name: input.fullName ?? null, role: input.role, invited_by: actor.userId }).select("*").single());
  if (!row.user_id) {
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const { error } = await c.auth.admin.inviteUserByEmail(input.email, { redirectTo: `${site}/admin` });
    if (error) throw new ApiError(502, "invite_failed", `Invite email failed: ${error.message}`);
  }
  await audit(actor, "staff.invite", "staff_members", row.id, null, row);
  return camel(row);
}

export async function updateStaff(actor: Actor, id: string, input: z.infer<typeof StaffPatchSchema>) {
  const c = db();
  const before = maybe(await c.from("staff_members").select("*").eq("id", id).maybeSingle());
  if (!before) notFound("Staff member");
  if (before.user_id === actor.userId && (input.role || input.status)) throw new ApiError(422, "self_change", "You cannot change your own role or status");
  const row = must(await c.from("staff_members").update({
    ...(input.role ? { role: input.role } : {}), ...(input.status ? { status: input.status } : {}),
    ...(input.suspendedReason !== undefined ? { suspended_reason: input.suspendedReason } : {}),
    ...(input.fullName !== undefined ? { full_name: input.fullName } : {}),
  }).eq("id", id).select("*").single());
  await audit(actor, "staff.update", "staff_members", id, before, row);
  return camel(row);
}

/** Deleting the row demotes the account to customer (trigger). */
export async function removeStaff(actor: Actor, id: string) {
  const c = db();
  const before = maybe(await c.from("staff_members").select("*").eq("id", id).maybeSingle());
  if (!before) notFound("Staff member");
  if (before.user_id === actor.userId) throw new ApiError(422, "self_change", "You cannot remove yourself");
  exec(await c.from("staff_members").delete().eq("id", id));
  await audit(actor, "staff.remove", "staff_members", id, before, null);
  return { id };
}
