import { ApiError, ok, route } from "@/backend/_core/http";
import { deleteFile, uploadFile } from "@/backend/admin/uploads";

/** multipart/form-data: file, bucket (product-media | category-media | collection-media | content-media), folder? */
export const POST = route("admin.uploads", async ({ req }) => {
  const form = await req.formData().catch(() => { throw new ApiError(400, "bad_form", "Send multipart/form-data"); });
  return ok(await uploadFile(form), { status: 201 });
});

/** JSON {bucket, path}. */
export const DELETE = route("admin.uploads", async ({ req }) => {
  const body: unknown = await req.json().catch(() => { throw new ApiError(400, "bad_json", "Request body must be JSON"); });
  return ok(await deleteFile(body));
});
