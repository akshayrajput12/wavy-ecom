import type { DropzoneImage } from "@/components/ui/ImageDropzone";
import { adminApi } from "../../api";
import type { Uploaded } from "./form";

const dimensions = (url: string) =>
  new Promise<{ width: number; height: number }>((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });

/** Upload the not-yet-saved files to product-media. Returns { error } on the first failure (already uploaded files are reported too). */
export async function uploadNewImages(media: DropzoneImage[], folder: string): Promise<{ up: Record<string, Uploaded>; error?: string }> {
  const up: Record<string, Uploaded> = {};
  for (const m of media) {
    if (!m.file) continue;
    const body = new FormData();
    body.set("file", m.file);
    body.set("bucket", "product-media");
    body.set("folder", folder);
    const [res, size] = await Promise.all([adminApi<{ url: string; path: string }>("POST", "uploads", body), dimensions(m.url)]);
    if (!res.ok) return { up, error: `Upload failed for ${m.file.name}: ${res.error}` };
    up[m.id] = { url: res.data.url, path: res.data.path, ...size };
  }
  return { up };
}
