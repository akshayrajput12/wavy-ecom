import { adminCopy } from "@/data/copy";

/** Same set every image bucket accepts (UPLOAD_BUCKETS in backend/admin/schemas/settings.ts, migration 0017). */
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export type SkipReason = "notImage" | "heic" | "format" | "size" | "count";
export type Skipped = { name: string; reason: SkipReason };
type Pick = { name: string; type: string; size: number };

const FORMAT: Record<string, string> = {
  "image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WebP", "image/avif": "AVIF", "image/svg+xml": "SVG", "image/gif": "GIF",
};
const isHeic = (f: Pick) => /^image\/hei[cf]/.test(f.type) || /\.hei[cf]$/i.test(f.name);
const accepts = (accept: string, type: string) =>
  accept.split(",").map((a) => a.trim()).some((a) => a === type || (a.endsWith("/*") && type.startsWith(a.slice(0, -1))));

/**
 * Which picked files to keep. max=1: the first valid file REPLACES the current image. Otherwise valid files fill
 * the remaining slots. Every file left out gets its own reason, in pick order.
 */
export function planPicks<F extends Pick>(files: F[], current: number, opts: { max: number; maxSizeMb: number; accept: string }) {
  const room = opts.max === 1 ? 1 : Math.max(0, opts.max - current);
  const accepted: F[] = [];
  const skipped: Skipped[] = [];
  for (const f of files) {
    const reason: SkipReason | null =
      isHeic(f) ? "heic"
      : !f.type.startsWith("image/") ? "notImage"
      : !accepts(opts.accept, f.type) ? "format"
      : f.size > opts.maxSizeMb * 1024 * 1024 ? "size"
      : accepted.length >= room ? "count"
      : null;
    if (reason) skipped.push({ name: f.name, reason });
    else accepted.push(f);
  }
  return { accepted, skipped, replace: opts.max === 1 && accepted.length > 0 };
}

/** "2 files skipped: a.heic (HEIC isn't supported…), b.png (over 8 MB)." null when nothing was skipped. */
export function skippedMessage(skipped: Skipped[], opts: { max: number; maxSizeMb: number; accept: string }): string | null {
  if (!skipped.length) return null;
  const d = adminCopy.dropzone;
  const why = (r: SkipReason) =>
    r === "size" ? d.reason.size(opts.maxSizeMb) : r === "count" ? d.reason.count(opts.max) : r === "format" ? d.reason.format(formatList(opts.accept)) : d.reason[r];
  return d.skipped(skipped.length, skipped.map((s) => `${s.name} (${why(s.reason)})`).join(", "));
}

/** "JPEG, PNG, WebP or AVIF". */
export function formatList(accept: string): string {
  const names = accept.split(",").map((a) => FORMAT[a.trim()] ?? a.trim().replace(/^image\//, "").toUpperCase());
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} ${adminCopy.dropzone.or} ${names.at(-1)}` : names[0];
}
