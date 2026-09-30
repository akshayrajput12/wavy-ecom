import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZodType } from "zod";
import type { Permission } from "@/backend/_core/permissions";
import type {
  AdminCampaign, AdminContentPage, AdminFaq, AdminHomeSection, AdminRedirect, AdminSeoOverride, AdminShippingMethod, AdminShippingZone, AdminTestimonial,
} from "@/types/admin";
import type { HomeSectionType } from "@/types/domain";
import { type Actor, audit, type CacheTag, camel, db, exec, maybe, must, notFound, read, revalidate, snake } from "./_shared";
import * as content from "./schemas/content";
import * as marketing from "./schemas/marketing";
import * as settings from "./schemas/settings";

type Row = Record<string, unknown>;
interface Resource {
  table: string;
  read: Permission | Permission[];
  write: Permission;
  create: ZodType;
  patch: ZodType;
  tags: CacheTag[];
  order: string;
  /** Adjust the row about to be written (stamps, derived columns, type-specific validation). */
  prepare?: (row: Row, actor: Actor, existing: Row | null) => Row;
}

const stampUpdatedBy = (row: Row, actor: Actor) => ({ ...row, updated_by: actor.userId });

/** Small admin tables with plain CRUD: /api/admin/<resource>[/<id>] and /api/admin/<resource>/reorder. */
export const RESOURCES = {
  faqs: { table: "faqs", read: "content.write", write: "content.write", create: content.FaqSchema, patch: content.FaqPatchSchema, tags: ["content"], order: "sort_order" },
  testimonials: { table: "testimonials", read: ["marketing.read", "testimonials.write"], write: "testimonials.write", create: content.TestimonialSchema, patch: content.TestimonialPatchSchema, tags: ["home", "content"], order: "sort_order" },
  pages: {
    table: "content_pages", read: "content.write", write: "content.write", create: content.ContentPageSchema, patch: content.ContentPagePatchSchema, tags: ["content"], order: "slug",
    prepare: (row, actor, existing) => ({
      ...stampUpdatedBy(row, actor),
      ...(row.status === "published" && existing?.status !== "published" ? { published_at: new Date().toISOString() } : {}),
    }),
  },
  "home-sections": {
    table: "home_sections", read: "content.write", write: "content.write", create: content.HomeSectionSchema, patch: content.HomeSectionPatchSchema, tags: ["home"], order: "sort_order",
    prepare: (row, actor, existing) => ({
      ...stampUpdatedBy(row, actor),
      ...(existing && row.config !== undefined ? { config: content.parseHomeConfig(existing.type as HomeSectionType, row.config) } : {}),
    }),
  },
  "seo-overrides": { table: "seo_overrides", read: "seo.write", write: "seo.write", create: content.SeoOverrideSchema, patch: content.SeoOverridePatchSchema, tags: ["content", "catalog"], order: "path", prepare: stampUpdatedBy },
  redirects: {
    table: "redirects", read: "seo.write", write: "seo.write", create: content.RedirectSchema, patch: content.RedirectPatchSchema, tags: ["content", "catalog"], order: "from_path",
    prepare: (row, actor, existing) => (existing ? row : { ...row, created_by: actor.userId }),
  },
  campaigns: {
    table: "campaigns", read: "marketing.read", write: "campaigns.write", create: marketing.CampaignSchema, patch: marketing.CampaignPatchSchema, tags: ["home", "content"], order: "created_at",
    prepare: (row, actor, existing) => (existing ? row : { ...row, created_by: actor.userId }),
  },
  "shipping-zones": { table: "shipping_zones", read: "settings.read", write: "settings.shipping.manage", create: settings.ShippingZoneSchema, patch: settings.ShippingZonePatchSchema, tags: ["settings"], order: "name" },
  "shipping-methods": { table: "shipping_methods", read: "settings.read", write: "settings.shipping.manage", create: settings.ShippingMethodSchema, patch: settings.ShippingMethodPatchSchema, tags: ["settings"], order: "sort_order" },
} satisfies Record<string, Resource>;
export type ResourceName = keyof typeof RESOURCES;
export const isResource = (name: string): name is ResourceName => Object.hasOwn(RESOURCES, name);

/** ponytail: table names come from the registry, so this path uses the untyped client and plain rows. */
const table = (r: Resource) => (db() as unknown as SupabaseClient).from(r.table);
const spec = (name: ResourceName): Resource => RESOURCES[name];

export async function listResource<T = Row>(name: ResourceName): Promise<T[]> {
  const r = spec(name);
  return read(r.read, [] as T[], async () =>
    (must(await table(r).select("*").order(r.order).order("created_at")) as Row[]).map((x) => camel(x) as T));
}

export async function getResource<T = Row>(name: ResourceName, id: string): Promise<T | null> {
  const r = spec(name);
  return read(r.read, null, async () => {
    const row = maybe(await table(r).select("*").eq("id", id).maybeSingle()) as Row | null;
    return row ? (camel(row) as T) : null;
  });
}

export async function createResource(actor: Actor, name: ResourceName, input: object) {
  const r = spec(name);
  const row = r.prepare ? r.prepare(snake(input), actor, null) : snake<Row>(input);
  const saved = must(await table(r).insert(row).select("*").single()) as Row;
  await audit(actor, `${name}.create`, r.table, String(saved.id), null, saved);
  revalidate(...r.tags);
  return camel(saved);
}

export async function updateResource(actor: Actor, name: ResourceName, id: string, input: object) {
  const r = spec(name);
  const before = maybe(await table(r).select("*").eq("id", id).maybeSingle()) as Row | null;
  if (!before) notFound(name);
  const row = r.prepare ? r.prepare(snake(input), actor, before) : snake<Row>(input);
  const saved = must(await table(r).update(row).eq("id", id).select("*").single()) as Row;
  await audit(actor, `${name}.update`, r.table, id, before, saved);
  revalidate(...r.tags);
  return camel(saved);
}

export async function deleteResource(actor: Actor, name: ResourceName, id: string) {
  const r = spec(name);
  const before = maybe(await table(r).select("*").eq("id", id).maybeSingle()) as Row | null;
  if (!before) notFound(name);
  exec(await table(r).delete().eq("id", id));
  await audit(actor, `${name}.delete`, r.table, id, before, null);
  revalidate(...r.tags);
  return { id };
}

/** sort_order = position in `ids` (tables with a sort_order column). */
export async function reorderResource(actor: Actor, name: ResourceName, ids: string[]) {
  const r = spec(name);
  if (r.order !== "sort_order") notFound(`${name} reorder`);
  for (const [i, id] of ids.entries()) exec(await table(r).update({ sort_order: i }).eq("id", id));
  await audit(actor, `${name}.reorder`, r.table, null, null, { ids });
  revalidate(...r.tags);
  return { updated: ids.length };
}

// typed getters for server pages
export const listFaqs = () => listResource<AdminFaq>("faqs");
export const listTestimonials = () => listResource<AdminTestimonial>("testimonials");
export const listContentPages = () => listResource<AdminContentPage>("pages");
export const listHomeSections = () => listResource<AdminHomeSection>("home-sections");
export const listSeoOverrides = () => listResource<AdminSeoOverride>("seo-overrides");
export const listRedirects = () => listResource<AdminRedirect>("redirects");
export const listCampaigns = () => listResource<AdminCampaign>("campaigns");
export async function listShippingZones(): Promise<AdminShippingZone[]> {
  const [zones, methods] = await Promise.all([listResource<Omit<AdminShippingZone, "methods">>("shipping-zones"), listResource<AdminShippingMethod>("shipping-methods")]);
  return zones.map((z) => ({ ...z, methods: methods.filter((m) => m.zoneId === z.id) }));
}
