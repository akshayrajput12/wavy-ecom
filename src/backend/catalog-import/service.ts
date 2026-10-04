import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dbError } from "@/backend/_core/db";
import { ApiError } from "@/backend/_core/http";
import { type Actor, audit, revalidate, userDb } from "@/backend/admin/_shared";
import { logger } from "@/lib/logger";
import { type ImportSummary, MAX_FILE_BYTES, XLSX_TYPE } from "./columns";
import { buildPlan } from "./plan";

export { buildTemplate } from "./template";

const log = logger.child({ svc: "admin.catalog_import" });

async function readUpload(file: unknown): Promise<{ name: string; buf: ArrayBuffer }> {
  if (!(file instanceof File)) throw new ApiError(422, "file_required", "Attach the .xlsx file in the `file` field");
  if (file.size === 0 || file.size > MAX_FILE_BYTES) throw new ApiError(413, "file_too_large", `Max ${MAX_FILE_BYTES / 1_048_576} MB`);
  if (!/\.xlsx$/i.test(file.name) && file.type !== XLSX_TYPE) throw new ApiError(415, "unsupported_type", "Upload an Excel workbook (.xlsx)");
  return { name: file.name.slice(0, 200), buf: await file.arrayBuffer() };
}

/** Dry run: counts, row-level errors and notes. Writes nothing. */
export async function previewImport(actor: Actor, file: unknown): Promise<ImportSummary> {
  return (await buildPlan(actor, (await readUpload(file)).buf)).summary;
}

/**
 * Re-reads and re-validates the uploaded file from scratch (the preview is never trusted), then writes everything
 * in one transaction (admin_import_catalog, 0027): any failure rolls the whole import back.
 */
export async function commitImport(actor: Actor, file: unknown): Promise<ImportSummary> {
  const { name, buf } = await readUpload(file);
  const { summary, doc, created, updated } = await buildPlan(actor, buf);
  if (summary.errorCount) throw new ApiError(422, "import_invalid", "The file has problems: fix them and upload it again", summary);
  if (!doc.categories.length && !doc.collections.length && !doc.products.length && !doc.memberships.length) return summary;
  // session client: auth.uid() and has_permission() apply inside the RPC (ledger actor, publish/stock permissions)
  const res = await ((await userDb()) as unknown as SupabaseClient).rpc("admin_import_catalog", { p_doc: doc });
  if (res.error) throw dbError(res.error, "import the catalog");
  await audit(actor, "catalog.import", "products", null, null, {
    file: name, counts: summary.counts, created, updated,
    categories: doc.categories.map((c) => c.slug), collections: doc.collections.map((c) => c.slug), memberships: doc.memberships,
  });
  revalidate("catalog", "home");
  log.info("catalog.imported", { actor: actor.userId, file: name, products: doc.products.length, categories: doc.categories.length, collections: doc.collections.length });
  return { ...summary, imported: true };
}
