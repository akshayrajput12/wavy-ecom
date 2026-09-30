import "server-only";
import { ApiError } from "@/backend/_core/http";
import type { Permission } from "@/backend/_core/permissions";
import { type Actor, audit, db, guard } from "./_shared";
import { UPLOAD_BUCKETS, UploadDeleteSchema, UploadMetaSchema, type UploadBucket } from "./schemas/settings";

const BUCKET_PERM: Record<UploadBucket, Permission[]> = {
  "product-media": ["catalog.write"], "category-media": ["catalog.write"], "collection-media": ["catalog.write"],
  "content-media": ["content.write", "blog.write"],
};
const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/svg+xml": "svg", "video/mp4": "mp4",
};

/** Guard by the bucket named in the request (permission depends on it). */
export const guardBucket = (bucket: UploadBucket): Promise<Actor> => guard(BUCKET_PERM[bucket]);

/**
 * multipart/form-data: file, bucket, folder?. Returns the public URL + storage path to store on the row.
 * ponytail: width/height are not sniffed server-side (no image lib); the client sends naturalWidth/Height with the media row.
 */
export async function uploadFile(form: FormData) {
  const meta = UploadMetaSchema.parse({ bucket: form.get("bucket"), folder: form.get("folder") || undefined });
  const actor = await guardBucket(meta.bucket);
  const file = form.get("file");
  if (!(file instanceof File)) throw new ApiError(422, "file_required", "Attach a file in the `file` field");
  const rule = UPLOAD_BUCKETS[meta.bucket];
  if (!(rule.mime as readonly string[]).includes(file.type)) throw new ApiError(415, "unsupported_type", `Allowed: ${rule.mime.join(", ")}`);
  if (file.size === 0 || file.size > rule.maxBytes) throw new ApiError(413, "file_too_large", `Max ${Math.round(rule.maxBytes / 1_048_576)} MB`);
  const path = `${meta.folder ?? new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${EXT[file.type]}`;
  const storage = db().storage.from(meta.bucket);
  const { error } = await storage.upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new ApiError(502, "upload_failed", error.message);
  const url = storage.getPublicUrl(path).data.publicUrl;
  await audit(actor, "upload.create", "storage.objects", `${meta.bucket}/${path}`, null, { bucket: meta.bucket, path, size: file.size, type: file.type });
  return { url, path, bucket: meta.bucket, size: file.size, contentType: file.type };
}

export async function deleteFile(body: unknown) {
  const { bucket, path } = UploadDeleteSchema.parse(body);
  const actor = await guardBucket(bucket);
  const { error } = await db().storage.from(bucket).remove([path]);
  if (error) throw new ApiError(502, "delete_failed", error.message);
  await audit(actor, "upload.delete", "storage.objects", `${bucket}/${path}`, { bucket, path }, null);
  return { bucket, path };
}
