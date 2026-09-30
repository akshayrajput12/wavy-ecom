import { toast } from "sonner";
import type { ZodError } from "zod";
import type { DropzoneImage } from "@/components/ui/ImageDropzone";
import { adminApi } from "../api";

export const toImgs = (url: string | null | undefined, alt: string | null | undefined): DropzoneImage[] =>
  url ? [{ id: url, url, alt: alt ?? "" }] : [];

/** Uploads a file to a storage bucket via /api/admin/uploads. null = failed (toast shown). */
export async function uploadFile(file: File, bucket: string): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("bucket", bucket);
  const r = await adminApi<{ url: string }>("POST", "uploads", fd);
  if (!r.ok) { toast.error("Image upload failed", { description: r.error }); return null; }
  return r.data.url;
}

/** Single-image field to { url, alt }, uploading a newly picked file. null = upload failed. */
export async function resolveImg(imgs: DropzoneImage[], bucket: string): Promise<{ url: string | null; alt: string } | null> {
  const i = imgs[0];
  if (!i) return { url: null, alt: "" };
  if (!i.file) return { url: i.url, alt: i.alt };
  const url = await uploadFile(i.file, bucket);
  return url ? { url, alt: i.alt } : null;
}

export const fieldErrors = (e: ZodError): Record<string, string> =>
  Object.fromEntries([...e.issues].reverse().map((i) => [i.path.join("."), i.message]));

/** Server 422 details ({ field: [msg] }) to a field to message map. */
export const serverErrors = (details: unknown): Record<string, string> =>
  details && typeof details === "object"
    ? Object.fromEntries(Object.entries(details as Record<string, unknown>).map(([k, v]) => [k, Array.isArray(v) ? String(v[0]) : String(v)]))
    : {};

export const dirtyKey = (v: unknown) => JSON.stringify(v);

// datetime-local values are treated as IST, independent of the browser timezone.
const IST = 330 * 60000;
export const toLocal = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() + IST).toISOString().slice(0, 16) : "");
export const fromLocal = (v: string) => (v ? new Date(`${v}:00+05:30`).toISOString() : null);
export const nul = (s: string) => (s.trim() ? s.trim() : null);
