import { ApiError, ok, route } from "@/backend/_core/http";
import { guard } from "@/backend/admin/_shared";
import { MAX_FILE_BYTES, XLSX_TYPE } from "@/backend/catalog-import/columns";
import { buildTemplate, commitImport, previewImport } from "@/backend/catalog-import/service";

/** The .xlsx import template, generated from the column spec and pre-filled with the current categories and collections. */
export const GET = route("admin.catalog_import", async () => {
  await guard("catalog.write");
  const day = new Date().toISOString().slice(0, 10);
  return new Response(await buildTemplate(), {
    headers: { "content-type": XLSX_TYPE, "content-disposition": `attachment; filename="wavy-catalog-import-${day}.xlsx"` },
  });
});

/** multipart/form-data: file (.xlsx), mode = "preview" (default, writes nothing) | "commit". */
export const POST = route("admin.catalog_import", async ({ req }) => {
  const actor = await guard("catalog.write");
  if (Number(req.headers.get("content-length") ?? 0) > MAX_FILE_BYTES + 65_536) throw new ApiError(413, "file_too_large", `Max ${MAX_FILE_BYTES / 1_048_576} MB`);
  const form = await req.formData().catch(() => { throw new ApiError(400, "bad_form", "Send multipart/form-data"); });
  const file = form.get("file");
  return ok(form.get("mode") === "commit" ? await commitImport(actor, file) : await previewImport(actor, file));
});
