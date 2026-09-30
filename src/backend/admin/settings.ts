import "server-only";
import type { z } from "zod";
import { ApiError } from "@/backend/_core/http";
import type { AdminAuditEntry, AdminIntegration, AdminStoreSettings, Paginated } from "@/types/admin";
import type { Json, TablesUpdate } from "@/types/database";
import { type Actor, audit, camel, db, maybe, must, notFound, pageRange, read, revalidate, snake } from "./_shared";
import type { AuditQuery, IntegrationPatchSchema, SettingsSection } from "./schemas/settings";

export const getStoreSettings = () => read("settings.read", null as AdminStoreSettings | null, async () => {
  const row = maybe(await db().from("store_settings").select("*").maybeSingle());
  return row ? camel(row) : null;
});

/** One section at a time; the route guards the section's permission (settings.write / tax / shipping). */
export async function updateStoreSettings(actor: Actor, section: SettingsSection, input: Record<string, unknown>) {
  const c = db();
  const before = maybe(await c.from("store_settings").select("*").maybeSingle());
  if (!before) notFound("Store settings");
  const row = must(await c.from("store_settings").update({ ...snake<TablesUpdate<"store_settings">>(input), updated_by: actor.userId })
    .eq("id", true).select("*").single());
  await audit(actor, `settings.${section}`, "store_settings", "store", before, row);
  revalidate("settings", "home");
  return camel(row);
}

export const listIntegrations = () => read("settings.read", [] as AdminIntegration[], async () =>
  must(await db().from("integration_configs").select("*").order("provider").order("environment")).map(camel));

const SECRET_KEY = /secret|salt|password|token|api[_-]?key/i;

export async function updateIntegration(actor: Actor, id: string, { config, ...input }: z.infer<typeof IntegrationPatchSchema>) {
  const c = db();
  if (config && Object.keys(config).some((k) => SECRET_KEY.test(k))) {
    throw new ApiError(422, "secret_in_config", "Secrets belong in environment variables; config holds non-secret values only");
  }
  const before = maybe(await c.from("integration_configs").select("*").eq("id", id).maybeSingle());
  if (!before) notFound("Integration");
  const row = must(await c.from("integration_configs").update({
    ...snake<TablesUpdate<"integration_configs">>(input),
    ...(config ? { config: { ...(before.config as Record<string, Json>), ...config } as Json } : {}),
    updated_by: actor.userId,
  }).eq("id", id).select("*").single());
  await audit(actor, "integration.update", "integration_configs", id, before, row);
  revalidate("settings");
  return camel(row);
}

export const listAuditLog = (q: z.infer<typeof AuditQuery>) =>
  read("audit.read", { items: [], total: 0, page: q.page, pageSize: q.pageSize } as Paginated<AdminAuditEntry>, async () => {
    const [from, to] = pageRange(q.page, q.pageSize);
    let b = db().from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (q.entityType) b = b.eq("entity_type", q.entityType);
    if (q.entityId) b = b.eq("entity_id", q.entityId);
    if (q.actorId) b = b.eq("actor_id", q.actorId);
    if (q.action) b = b.like("action", `${q.action.replace(/[%_]/g, "")}%`);
    if (q.from) b = b.gte("created_at", q.from);
    if (q.to) b = b.lt("created_at", q.to);
    const res = await b.range(from, to);
    return { items: must(res).map(camel), total: res.count ?? 0, page: q.page, pageSize: q.pageSize };
  });
