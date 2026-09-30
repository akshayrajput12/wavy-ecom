import type { ZodType } from "zod";
import { ok, parse, route } from "@/backend/_core/http";
import { guard, notFound } from "@/backend/admin/_shared";
import { updateStoreSettings } from "@/backend/admin/settings";
import { SETTINGS_SECTIONS, type SettingsSection } from "@/backend/admin/schemas/settings";

const isSection = (s: string): s is SettingsSection => Object.hasOwn(SETTINGS_SECTIONS, s);

/** general (settings.write) | tax (settings.tax.manage) | shipping (settings.shipping.manage). */
export const PATCH = route<{ section: string }>("admin.settings", async ({ req, params }) => {
  const section = isSection(params.section) ? params.section : notFound(`Settings section "${params.section}"`);
  const { permission, schema } = SETTINGS_SECTIONS[section];
  const actor = await guard(permission);
  const input = await parse(req, schema as ZodType<Record<string, unknown>>);
  return ok(await updateStoreSettings(actor, section, input));
});
